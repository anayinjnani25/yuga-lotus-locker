/*
  Yuga Lotus Locker v2 - Arduino Uno, every puzzle stage has a sensor
  ------------------------------------------------------------------
  Stage 1  Code 1709 on the keypad          -> lid latch servo opens
  Stage 2  Picture puzzle: 3 turning bands   -> 3 reed switches (one per band)
  Stage 3  Four yuga leaves in their sockets -> 4 reed switches
  Stage 4  Ring turned until holes line up   -> 1 reed switch
  Stage 5  Button pushed through the holes   -> microswitch -> lotus servo opens petals
  Reset    * closes the lotus. Take the leaves out and close the lid:
           the box locks itself (lid reed switch).
  Test     Type 0000 when locked to see every sensor live on the screen.
           In test mode: 1 = open latch, 2 = open lotus, 3 = close both,
           4 = light test, * = leave test mode.

  Libraries (Arduino IDE > Tools > Manage Libraries):
    Keypad (Mark Stanley), LiquidCrystal I2C (Frank de Brabander),
    Adafruit NeoPixel (Adafruit). Servo and Wire are built in.

  Wiring (Arduino Uno)
    Keypad 3x4           rows D2 D3 D4 D5, cols D6 D7 D8
    Lid latch servo      D9   (power from the 5 V supply)
    Lotus servo          D10  (power from the 5 V supply)
    NeoPixel ring (8)    D11 through a 330 ohm resistor
    Buzzer               D12
    Button microswitch   A0 -> GND
    Lid closed reed      A1 -> GND
    I2C bus              A4 = SDA, A5 = SCL -> LCD (0x27) and PCF8574 (0x20)
    PCF8574 inputs (each switch goes to GND):
      P0 Satya leaf, P1 Treta leaf, P2 Dwapara leaf, P3 Kali leaf,
      P4 band 1 (top), P5 band 2 (middle), P6 band 3 (bottom), P7 ring aligned
*/

#include <Keypad.h>
#include <Servo.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Adafruit_NeoPixel.h>

// ---------- settings you can change ----------
const char SECRET_CODE[] = "1709";
const char TEST_CODE[]   = "0000";
const int LID_LOCKED   = 0;     // latch servo angles
const int LID_OPEN     = 90;
const int LOTUS_CLOSED = 10;    // lotus servo angles: rod should rise 2-3 cm
const int LOTUS_OPEN   = 150;
const byte LCD_ADDR = 0x27;     // try 0x3F if the screen is blank
const byte PCF_ADDR = 0x20;     // PCF8574 with A0 A1 A2 set to GND

// ---------- pins ----------
const byte ROWS = 4, COLS = 3;
char keys[ROWS][COLS] = {{'1','2','3'},{'4','5','6'},{'7','8','9'},{'*','0','#'}};
byte rowPins[ROWS] = {2, 3, 4, 5};
byte colPins[COLS] = {6, 7, 8};
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

const byte PIN_LID_SERVO = 9, PIN_LOTUS_SERVO = 10, PIN_LEDS = 11, PIN_BUZZER = 12;
const byte PIN_BUTTON = A0, PIN_LID_CLOSED = A1;

// PCF8574 bit numbers
const byte BIT_LEAF[4] = {0, 1, 2, 3};
const byte BIT_BAND[3] = {4, 5, 6};
const byte BIT_RING = 7;

// ---------- yuga data ----------
const char* YUGA_NAME[4] = {"Satya Yuga", "Treta Yuga", "Dwapara Yuga", "Kali Yuga"};
const char* YUGA_COIN[4] = {"Gold coin", "Silver coin", "Copper coin", "Iron coin"};
const uint8_t YUGA_RGB[4][3] = {{255,170,0},{190,200,220},{230,100,40},{80,90,110}};

LiquidCrystal_I2C lcd(LCD_ADDR, 16, 2);
Adafruit_NeoPixel leds(8, PIN_LEDS, NEO_GRB + NEO_KHZ800);
Servo lidServo, lotusServo;

enum State { LOCKED, LOCKOUT, PUZZLE, LEAVES, RING, BUTTON, OPEN, RESETTING, TEST };
State state = LOCKED;

char entered[5];
byte codeLen = 0, wrongTries = 0, coinShown = 0;
byte lastInputs = 0xFF;
bool leafIn[4] = {false, false, false, false};
int lotusPos = LOTUS_CLOSED;
unsigned long timer = 0;

// ---------- inputs ----------
byte readPCF() {                       // returns 8 bits, 0 = switch closed
  Wire.requestFrom(PCF_ADDR, (byte)1);
  if (Wire.available()) lastInputs = Wire.read();
  return lastInputs;
}
bool pcfClosed(byte bit) {
  byte a = readPCF(); delay(5); byte b = readPCF();
  return !(a & (1 << bit)) && !(b & (1 << bit));
}
bool pinClosed(byte pin) {
  if (digitalRead(pin) != LOW) return false;
  delay(10);
  return digitalRead(pin) == LOW;
}
int bandsSolved() { int n = 0; for (byte i = 0; i < 3; i++) if (pcfClosed(BIT_BAND[i])) n++; return n; }
int leavesIn()    { int n = 0; for (byte i = 0; i < 4; i++) if (pcfClosed(BIT_LEAF[i])) n++; return n; }

// ---------- outputs ----------
void show(const char* a, const char* b = "") {
  lcd.clear(); lcd.setCursor(0, 0); lcd.print(a); lcd.setCursor(0, 1); lcd.print(b);
}
void beep(int f, int ms) { tone(PIN_BUZZER, f, ms); delay(ms + 20); }
void allLeds(uint8_t r, uint8_t g, uint8_t b) { for (byte i = 0; i < 8; i++) leds.setPixelColor(i, r, g, b); leds.show(); }
void yugaLeds(byte k, bool on) {       // 2 LEDs per yuga: LEDs 2k and 2k+1
  for (byte j = 0; j < 2; j++)
    leds.setPixelColor(k * 2 + j, on ? YUGA_RGB[k][0] : 0, on ? YUGA_RGB[k][1] : 0, on ? YUGA_RGB[k][2] : 0);
  leds.show();
}
void moveSlow(Servo &s, int &pos, int target, int stepMs) {
  while (pos != target) { pos += (target > pos) ? 1 : -1; s.write(pos); delay(stepMs); }
}
void showCodePrompt() {
  char line[17] = "Code: ";
  for (byte i = 0; i < codeLen; i++) strcat(line, "*");
  show("Yuga Lotus Box", line);
}

// ---------- stage changes ----------
void goLocked() {
  lidServo.write(LID_LOCKED);
  allLeds(0, 0, 0);
  codeLen = 0;
  for (byte i = 0; i < 4; i++) leafIn[i] = false;
  state = LOCKED;
  showCodePrompt();
}
void goPuzzle() {
  wrongTries = 0;
  beep(880, 120); beep(1175, 200);
  lidServo.write(LID_OPEN);
  show("Unlocked!", "Open the box");
  delay(2000);
  timer = 0;
  state = PUZZLE;
}
void goLeaves() {
  show("Puzzle solved!", "Attach the leaves");
  beep(988, 120); beep(1319, 250);
  allLeds(0, 0, 0);
  state = LEAVES;
}
void goRing()   { show("All 4 leaves in!", "Turn the ring"); beep(1047, 120); beep(1397, 250); state = RING; }
void goButton() { show("Holes lined up!", "Push the button"); beep(1319, 120); beep(1568, 300); state = BUTTON; }
void goOpen() {
  show("The lotus opens", "...");
  for (byte k = 0; k < 4; k++) yugaLeds(k, true);
  moveSlow(lotusServo, lotusPos, LOTUS_OPEN, 15);
  int notes[] = {523, 659, 784, 1047, 784, 1047}, lens[] = {150, 150, 150, 300, 150, 450};
  for (byte i = 0; i < 6; i++) beep(notes[i], lens[i]);
  coinShown = 0; timer = 0;
  state = OPEN;
}

// ---------- test mode screen ----------
void showTest() {
  byte v = readPCF();
  char l1[17], l2[17];
  // 1 = closed (magnet present / pressed), 0 = open
  snprintf(l1, sizeof(l1), "Lf%d%d%d%d Bd%d%d%d R%d",
           !(v & 1), !(v >> 1 & 1), !(v >> 2 & 1), !(v >> 3 & 1),
           !(v >> 4 & 1), !(v >> 5 & 1), !(v >> 6 & 1), !(v >> 7 & 1));
  snprintf(l2, sizeof(l2), "Btn%d Lid%d *=out", digitalRead(PIN_BUTTON) == LOW, digitalRead(PIN_LID_CLOSED) == LOW);
  lcd.setCursor(0, 0); lcd.print(l1); lcd.print("   ");
  lcd.setCursor(0, 1); lcd.print(l2);
}

// ---------- setup ----------
void setup() {
  pinMode(PIN_BUTTON, INPUT_PULLUP);
  pinMode(PIN_LID_CLOSED, INPUT_PULLUP);
  pinMode(PIN_BUZZER, OUTPUT);
  Wire.begin();
  Wire.beginTransmission(PCF_ADDR); Wire.write(0xFF); Wire.endTransmission();   // all PCF pins as inputs
  lcd.init(); lcd.backlight();
  leds.begin(); leds.setBrightness(80); leds.show();
  lidServo.attach(PIN_LID_SERVO);
  lotusServo.attach(PIN_LOTUS_SERVO);
  lotusServo.write(LOTUS_CLOSED);
  show("Yuga Lotus Box", "Welcome!");
  delay(1500);
  goLocked();
}

// ---------- main loop ----------
void loop() {
  char key = keypad.getKey();

  switch (state) {

    case LOCKED:
      if (key >= '0' && key <= '9' && codeLen < 4) {
        entered[codeLen++] = key; entered[codeLen] = '\0';
        beep(1200, 40);
        showCodePrompt();
        if (codeLen == 4) {
          delay(300);
          if (strcmp(entered, SECRET_CODE) == 0) goPuzzle();
          else if (strcmp(entered, TEST_CODE) == 0) { state = TEST; lcd.clear(); }
          else {
            wrongTries++;
            beep(200, 500); show("Wrong code", "Try again"); delay(1200);
            codeLen = 0;
            if (wrongTries >= 3) { state = LOCKOUT; timer = millis(); } else showCodePrompt();
          }
        }
      } else if (key == '*') { codeLen = 0; showCodePrompt(); }
      break;

    case LOCKOUT: {
      unsigned long left = 10 - (millis() - timer) / 1000;
      char line[17]; snprintf(line, sizeof(line), "Wait %lu sec   ", left);
      lcd.setCursor(0, 0); lcd.print("Too many tries  ");
      lcd.setCursor(0, 1); lcd.print(line);
      if (millis() - timer >= 10000) { wrongTries = 0; state = LOCKED; showCodePrompt(); }
      delay(200);
      break;
    }

    case PUZZLE:                      // update the screen twice a second
      if (millis() - timer > 500) {
        timer = millis();
        char line[17];
        bool b[3];
        for (byte i = 0; i < 3; i++) b[i] = pcfClosed(BIT_BAND[i]);
        snprintf(line, sizeof(line), "Bands %c %c %c", b[0] ? 'Y' : '-', b[1] ? 'Y' : '-', b[2] ? 'Y' : '-');
        lcd.setCursor(0, 0); lcd.print("Solve the puzzle");
        lcd.setCursor(0, 1); lcd.print(line); lcd.print("    ");
        for (byte i = 0; i < 3; i++) leds.setPixelColor(i, b[i] ? 0 : 40, b[i] ? 120 : 0, 0);
        leds.show();
        if (b[0] && b[1] && b[2]) goLeaves();
      }
      break;

    case LEAVES:
      for (byte i = 0; i < 4; i++) {
        bool now = pcfClosed(BIT_LEAF[i]);
        if (now && !leafIn[i]) {
          leafIn[i] = true; yugaLeds(i, true);
          char line[17]; snprintf(line, sizeof(line), "%d of 4 leaves", leavesIn());
          show(YUGA_NAME[i], line);
          beep(1000 + i * 150, 150);
        } else if (!now && leafIn[i]) { leafIn[i] = false; yugaLeds(i, false); }
      }
      if (leavesIn() == 4) goRing();
      break;

    case RING:
      if (leavesIn() < 4) { show("A leaf came out", "Put it back"); state = LEAVES; }
      else if (pcfClosed(BIT_RING)) goButton();
      break;

    case BUTTON:
      if (!pcfClosed(BIT_RING)) { show("Ring moved", "Line holes up"); state = RING; }
      else if (pinClosed(PIN_BUTTON)) goOpen();
      break;

    case OPEN:
      if (millis() - timer > 2500) {
        timer = millis();
        show(YUGA_NAME[coinShown], YUGA_COIN[coinShown]);
        allLeds(0, 0, 0); yugaLeds(coinShown, true);
        coinShown = (coinShown + 1) % 4;
        if (coinShown == 0) { delay(2500); show("Collect coins!", "* to close"); for (byte k = 0; k < 4; k++) yugaLeds(k, true); timer = millis(); }
      }
      if (key == '*') {
        moveSlow(lotusServo, lotusPos, LOTUS_CLOSED, 12);
        show("Take out leaves", "then close lid");
        allLeds(0, 0, 0);
        state = RESETTING;
      }
      break;

    case RESETTING:                   // locks by itself once leaves are out and lid is shut
      if (leavesIn() == 0 && pinClosed(PIN_LID_CLOSED)) {
        delay(800);
        if (pinClosed(PIN_LID_CLOSED)) { beep(700, 100); goLocked(); }
      }
      break;

    case TEST:
      showTest();
      if (key == '1') lidServo.write(LID_OPEN);
      if (key == '2') moveSlow(lotusServo, lotusPos, LOTUS_OPEN, 8);
      if (key == '3') { lidServo.write(LID_LOCKED); moveSlow(lotusServo, lotusPos, LOTUS_CLOSED, 8); }
      if (key == '4') { for (byte k = 0; k < 4; k++) yugaLeds(k, true); delay(1500); allLeds(0, 0, 0); }
      if (key == '*') { lidServo.write(LID_LOCKED); moveSlow(lotusServo, lotusPos, LOTUS_CLOSED, 8); goLocked(); }
      delay(100);
      break;
  }
}
