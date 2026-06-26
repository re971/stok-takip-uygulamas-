import { StockComponent, Project } from "../types";

export const SAMPLE_COMPONENTS = (userId: string): Omit<StockComponent, "id">[] => [
  {
    name: "Arduino Uno R3",
    category: "Mikrodenetleyici",
    quantity: 2,
    minQuantity: 1,
    location: "Kutu A1 - Geliştirme Kartları",
    notes: "Atmega328P tabanlı klasik geliştirme kartı",
    userId
  },
  {
    name: "ESP32 NodeMCU",
    category: "Mikrodenetleyici",
    quantity: 3,
    minQuantity: 1,
    location: "Kutu A2 - Kablosuz Kartlar",
    notes: "Wi-Fi ve Bluetooth destekli IoT kartı",
    userId
  },
  {
    name: "HC-SR04 Ultrasonik Mesafe Sensörü",
    category: "Sensör",
    quantity: 4,
    minQuantity: 2,
    location: "Çekmece B3 - Mesafe/Hareket",
    notes: "2cm - 400cm arası mesafe ölçüm sensörü",
    userId
  },
  {
    name: "DHT11 Sıcaklık ve Nem Sensörü",
    category: "Sensör",
    quantity: 1,
    minQuantity: 2,
    location: "Çekmece B1 - Çevre Sensörleri",
    notes: "Sıcaklık ve bağıl nem ölçen ucuz sensör",
    userId
  },
  {
    name: "SG90 Mini Servo Motor",
    category: "Aktüatör",
    quantity: 5,
    minQuantity: 2,
    location: "Kutu C1 - Motorlar",
    notes: "180 derece dönebilen 9g servo motor",
    userId
  },
  {
    name: "5V Tekli Röle Modülü",
    category: "Aktüatör",
    quantity: 2,
    minQuantity: 1,
    location: "Kutu C2 - Güç ve Röle",
    notes: "Yüksek güç anahtarlama modülü",
    userId
  },
  {
    name: "16x2 I2C LCD Ekran",
    category: "Ekran",
    quantity: 1,
    minQuantity: 1,
    location: "Çekmece D1 - Ekranlar",
    notes: "I2C modülü lehimlenmiş 16x2 karakter ekran",
    userId
  },
  {
    name: "Kırmızı LED (5mm)",
    category: "Pasif Bileşen",
    quantity: 25,
    minQuantity: 10,
    location: "Poşet E1 - LEDler",
    notes: "Genel kullanım 5mm LED",
    userId
  },
  {
    name: "220 Ohm Direnç (1/4W)",
    category: "Pasif Bileşen",
    quantity: 40,
    minQuantity: 20,
    location: "Poşet E2 - Dirençler",
    notes: "LED akım sınırlama için ideal",
    userId
  },
  {
    name: "10K Potansiyometre",
    category: "Pasif Bileşen",
    quantity: 3,
    minQuantity: 2,
    location: "Poşet E2 - Potlar",
    notes: "Analog giriş kontrolü ve ayar için döner direnç",
    userId
  },
  {
    name: "Büyük Boy Breadboard",
    category: "Prototipleme (Breadboard vb.)",
    quantity: 2,
    minQuantity: 1,
    location: "Tezgah Üstü - Breadboard",
    notes: "830 delikli prototipleme tahtası",
    userId
  },
  {
    name: "Erkek-Erkek Jumper Kablo Seti",
    category: "Güç ve Kablo",
    quantity: 60,
    minQuantity: 20,
    location: "Asılı Kutu F1 - Kablolar",
    notes: "Farklı boylarda bağlantı kabloları",
    userId
  }
];

export const SAMPLE_PROJECTS = (userId: string): Omit<Project, "id">[] => [
  {
    title: "Akıllı Mesafe Ölçer",
    description: "HC-SR04 ultrasonik sensör ile önündeki engeli ölçen ve mesafe 10cm'den az ise kırmızı LED yakan devre.",
    status: "Yapım Aşamasında",
    circuitInstructions: "1. Arduino 5V pinini breadboard artı hattına (+), GND pinini eksi hattına (-) bağlayın.\n2. HC-SR04 VCC'yi 5V'a, GND'yi GND'ye, Trig pinini Arduino Pin 9'a, Echo pinini Arduino Pin 10'a bağlayın.\n3. Kırmızı LED'in uzun bacağını (anot) 220 Ohm direnç üzerinden Arduino Pin 13'e, kısa bacağını (katot) GND'ye bağlayın.",
    codeSnippet: `// Akıllı Mesafe Ölçer Arduino Kodu
const int trigPin = 9;
const int echoPin = 10;
const int ledPin = 13;

long duration;
int distance;

void setup() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(ledPin, OUTPUT);
  Serial.begin(9650);
}

void loop() {
  // Trig tetiklemesi yapılıyor
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  // Süre ölçülüyor
  duration = pulseIn(echoPin, HIGH);
  
  // Mesafe hesaplanıyor (cm cinsinden)
  distance = duration * 0.034 / 2;
  
  Serial.print("Mesafe: ");
  Serial.print(distance);
  Serial.println(" cm");
  
  // 10cm'den yakınsa LED yansın
  if (distance < 10) {
    digitalWrite(ledPin, HIGH);
  } else {
    digitalWrite(ledPin, LOW);
  }
  
  delay(100);
}`,
    neededComponents: [
      { name: "Arduino Uno R3", quantity: 1, category: "Mikrodenetleyici" },
      { name: "HC-SR04 Ultrasonik Mesafe Sensörü", quantity: 1, category: "Sensör" },
      { name: "Kırmızı LED (5mm)", quantity: 1, category: "Pasif Bileşen" },
      { name: "220 Ohm Direnç (1/4W)", quantity: 1, category: "Pasif Bileşen" },
      { name: "Büyük Boy Breadboard", quantity: 1, category: "Prototipleme (Breadboard vb.)" },
      { name: "Erkek-Erkek Jumper Kablo Seti", quantity: 6, category: "Güç ve Kablo" }
    ],
    userId
  }
];
