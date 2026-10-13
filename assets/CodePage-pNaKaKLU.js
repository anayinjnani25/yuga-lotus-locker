import{r as h,j as n,P as f,a as b}from"./index-Cu3voYc0.js";const p=`/*
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
        entered[codeLen++] = key; entered[codeLen] = '\\0';
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
`,u=[{id:"header",title:"What the program does",start:"/*",parts:["arduino","keypad","servo-lid","servo-lotus","neopixel","buzzer","microswitch","lid-reed","pcf8574","lcd"],note:"The comment at the top is the whole story in one place: the five stages, the reset, the test mode, the libraries to install and the complete wiring list. Every pin shown on this website comes from here."},{id:"libs",title:"Libraries",start:"#include <Keypad.h>",parts:["keypad","servo-lid","lcd","neopixel","pcf8574"],note:"Keypad reads the 3×4 matrix, Servo drives the two SG90s, Wire talks I2C to the LCD and the PCF8574, LiquidCrystal_I2C prints on the screen and Adafruit_NeoPixel colours the LED ring."},{id:"settings",title:"Settings you can change",start:"// ---------- settings",parts:["keypad","servo-lid","servo-lotus","lcd","pcf8574"],note:"The secret code (1709) and the teacher test code (0000), the servo angles for the latch (0° / 90°) and the lotus (10° / 150°), and the two I2C addresses. If a servo moves too little or too much, change these numbers and upload again."},{id:"pins",title:"Pins",start:"// ---------- pins",parts:["keypad","servo-lid","servo-lotus","neopixel","buzzer","microswitch","lid-reed","reed-leaves","reed-bands","reed-ring"],note:"The keypad map and its 7 pins (rows D2–D5, columns D6–D8), the servo, LED and buzzer pins (D9–D12), the two direct inputs (A0, A1), and which PCF8574 bit belongs to each leaf, band and the ring."},{id:"yuga",title:"Yuga data",start:"// ---------- yuga data",parts:["neopixel","coins","lcd"],note:"Names and coins for the screen, and the RGB colour of each yuga's metal for the LEDs: gold, silver, copper and iron."},{id:"objects",title:"Objects and state",start:"LiquidCrystal_I2C lcd(",parts:["lcd","neopixel","servo-lid","servo-lotus"],note:"The screen, LED ring and servos are created here. The State enum lists every mode the box can be in. The variables remember the typed code, wrong tries, which leaves are in and where the lotus servo is."},{id:"inputs",title:"Reading the sensors",start:"// ---------- inputs",parts:["pcf8574","reed-bands","reed-leaves","reed-ring","microswitch","lid-reed"],note:'readPCF() asks the PCF8574 for one byte. pcfClosed() reads it twice, 5 ms apart, and only says "closed" if both readings agree, which ignores contact bounce. pinClosed() does the same for A0 and A1 with a 10 ms gap.'},{id:"outputs",title:"Screen, sound, lights and motion",start:"// ---------- outputs",parts:["lcd","buzzer","neopixel","servo-lotus"],note:"show() prints two lines, beep() plays a tone, yugaLeds(k) lights LEDs 2k and 2k+1 in yuga k's colour, and moveSlow() turns a servo one degree at a time so the lotus opens gently."},{id:"stages",title:"Moving between stages",start:"// ---------- stage changes",parts:["servo-lid","servo-lotus","lcd","neopixel","buzzer"],note:"Each go…() function is one moment in the game: lock, unlock (latch servo to 90°), puzzle solved, all leaves in, holes lined up, and open (all LEDs on, lotus servo to 150°, then the six-note tune)."},{id:"test",title:"Test mode screen",start:"// ---------- test mode",parts:["pcf8574","microswitch","lid-reed","lcd"],note:'Shows every sensor live, for example "Lf1000 Bd110 R0" and "Btn0 Lid1". A 1 means that magnet or button is detected. Use it to check each reed switch before you play.'},{id:"setup",title:"setup()",start:"// ---------- setup",parts:["microswitch","lid-reed","buzzer","pcf8574","lcd","neopixel","servo-lid","servo-lotus"],note:"Runs once at power-on: inputs with pull-ups, all PCF8574 pins set as inputs by writing 0xFF, screen and LEDs started, servos attached and the lotus closed, a welcome message, then the box locks."},{id:"locked",title:"loop(): LOCKED",start:"// ---------- main loop",parts:["keypad","lcd","buzzer"],note:"The loop reads one key and acts on the current state. While locked, digits are collected (shown as stars). Four digits are compared with 1709 (unlock) and 0000 (test mode). Three wrong tries lock the keypad. * clears the entry."},{id:"lockout",title:"loop(): LOCKOUT",start:"case LOCKOUT",parts:["lcd"],note:"After three wrong codes the screen counts down 10 seconds before the keypad works again."},{id:"puzzle",title:"loop(): PUZZLE (stage 3)",start:"case PUZZLE",parts:["reed-bands","picture-bands","lcd","neopixel"],note:'Twice a second it checks the three band reed switches, prints "Bands Y Y –" and colours LEDs 0–2 red or green. When all three are right it moves on to the leaves.'},{id:"leaves",title:"loop(): LEAVES (stage 4)",start:"case LEAVES",parts:["reed-leaves","leaves","neopixel","lcd","buzzer"],note:'Watches the four leaf sockets. Each new leaf lights its two LEDs, names its yuga, counts "n of 4 leaves" and beeps a rising note. A leaf pulled out goes dark again.'},{id:"ring",title:"loop(): RING and BUTTON (stages 4–5)",start:"case RING",parts:["reed-ring","leaf-ring","microswitch","button"],note:"RING waits for the ring reed (P7). BUTTON waits for the microswitch on A0. If a leaf comes out or the ring moves away, the box steps back and tells the child why."},{id:"open",title:"loop(): OPEN (stage 5)",start:"case OPEN",parts:["coins","neopixel","lcd","servo-lotus","keypad"],note:`Every 2.5 seconds it names the next coin and lights only that yuga's LEDs, then shows "Collect coins! * to close". Pressing * closes the lotus slowly.`},{id:"resetting",title:"loop(): RESETTING",start:"case RESETTING",parts:["reed-leaves","lid-reed","servo-lid"],note:"The box locks itself once all leaves are out and the lid reed (A1) has stayed closed for 0.8 seconds."},{id:"testcase",title:"loop(): TEST",start:"case TEST",parts:["servo-lid","servo-lotus","neopixel"],note:"Teacher mode. 1 opens the latch, 2 opens the lotus, 3 closes both, 4 tests the LEDs and * leaves test mode and relocks."}],g=/^(const|char|byte|int|bool|void|unsigned|long|uint8_t|enum|return|if|else|for|while|switch|case|break|true|false|default)$/,m=/^(Keypad|Servo|LiquidCrystal_I2C|Adafruit_NeoPixel|State|Wire)$/;function y(i){const l=[],d=/(\/\/.*$|\/\*.*?\*\/|\/\*.*$|^\s*\*.*$|^.*\*\/)|("(?:\\.|[^"])*"|'(?:\\.|[^'])*')|(#\w+)|(\b0x[0-9A-Fa-f]+\b|\b\d+\b)|([A-Za-z_]\w*)(?=\s*\()|([A-Za-z_]\w*)/g;let a=0,o,e=0;for(;o=d.exec(i);){o.index>a&&l.push(i.slice(a,o.index));const[t]=o,s=o[1]?"tk-c":o[2]?"tk-s":o[3]?"tk-p":o[4]?"tk-n":o[5]?g.test(t)?"tk-k":"tk-f":g.test(t)?"tk-k":m.test(t)?"tk-t":"";l.push(s?n.jsx("span",{className:s,children:t},e++):t),a=o.index+t.length}return a<i.length&&l.push(i.slice(a)),l}function w(){const i=h.useMemo(()=>p.replace(/\r/g,"").split(`
`),[]),l=h.useMemo(()=>{const e=u.map(t=>i.findIndex(s=>s.includes(t.start)));return u.map((t,s)=>{const c=e[s];let r=s+1<e.length?e[s+1]:i.length;for(;r>c&&!i[r-1].trim();)r--;return{...t,from:c,lines:i.slice(c,r)}}).filter(t=>t.from>=0)},[i]),[d,a]=h.useState("");async function o(){try{await navigator.clipboard.writeText(p),a("Copied")}catch{a("Copy failed: select the code and press Ctrl+C")}setTimeout(()=>a(""),2500)}return n.jsxs(n.Fragment,{children:[n.jsx("h1",{children:"Code"}),n.jsxs("p",{className:"lede",children:["The real Arduino program, ",n.jsx("code",{children:"firmware/yuga_lotus_locker_v2.ino"})," (",i.length," lines), split into sections. Each note links to the parts that section reads or drives."]}),n.jsx("p",{children:n.jsx("button",{className:"btn",onClick:o,children:d||"Copy the whole program"})}),n.jsxs("div",{className:"code-layout",children:[n.jsx("nav",{className:"code-toc card","aria-label":"Code sections",children:n.jsx("ol",{children:l.map(e=>n.jsx("li",{children:n.jsx("a",{href:"#/code",onClick:t=>{var s;t.preventDefault(),(s=document.getElementById("code-"+e.id))==null||s.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"})},children:e.title})},e.id))})}),n.jsx("div",{children:l.map(e=>n.jsxs("section",{id:"code-"+e.id,className:"code-sec","aria-labelledby":"h-"+e.id,children:[n.jsx("pre",{className:"code",tabIndex:0,"aria-label":`${e.title}, lines ${e.from+1} to ${e.from+e.lines.length}`,children:e.lines.map((t,s)=>n.jsxs("div",{children:[n.jsx("span",{className:"ln",children:e.from+s+1}),y(t)]},s))}),n.jsxs("div",{className:"code-note",children:[n.jsx("h3",{id:"h-"+e.id,children:e.title}),n.jsx("p",{children:e.note}),n.jsx("div",{className:"related",children:e.parts.map(t=>{var s;return n.jsxs("a",{className:"rel",href:b(t),style:{textDecoration:"none"},children:[((s=f[t])==null?void 0:s.name)??t," ↗"]},t)})})]})]},e.id))})]})]})}export{w as default};
