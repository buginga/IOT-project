//Programa: Acelerometro com ESP8266 NodeMCU
#include <ESP8266WiFi.h> // biblioteca para usar as funções de Wifi do módulo ESP8266
#include <Wire.h>         // biblioteca de comunicação I2C
#include <PubSubClient.h> // Importa a Biblioteca PubSubClient

#define TOPICO_SUBSCRIBE "pos"     

#define ID_MQTT  "o2" 

const int green = D0;
const int red = D1;
bool red_state = LOW;
bool green_state = HIGH;

// WIFI
const char* SSID = "AndroidAP";
const char* PASSWORD = "oyfv2113";

 // MQTT
const char* BROKER_MQTT = "192.168.43.171";
//IPAddress BROKER_MQTT(192, 168, 1, 21);
int BROKER_PORT = 1883; // Porta do Broker MQTT

WiFiClient espClient; // Cria o objeto espClient
PubSubClient MQTT(espClient); // Instancia o Cliente MQTT passando o objeto espClient
 
 
void reconnectWiFi() 
{
  if(WiFi.status() == WL_CONNECTED)
    return;
 
  WiFi.begin(SSID, PASSWORD);
 
  while(WiFi.status() != WL_CONNECTED) {
    delay(100);
    Serial.print(".");
  }
 
  Serial.println();
  Serial.print("Conectado com sucesso na rede: ");
  Serial.println(SSID);
  Serial.print("IP obtido: ");
  Serial.println(WiFi.localIP());  
}
 
void initWiFi()
{
  delay(10);
  Serial.print("Conectando-se na rede: ");
  Serial.println(SSID);
  Serial.println("Aguarde");
 
  reconnectWiFi();
}
void initMQTT() 
{
    MQTT.setServer(BROKER_MQTT, BROKER_PORT);   //informa qual broker e porta deve ser conectado
    MQTT.setCallback(mqtt_callback);            //atribui função de callback (função chamada quando qualquer informação de um dos tópicos subescritos chega)
}


void reconnectMQTT() 
{
    while (!MQTT.connected()) 
    {
        Serial.print("* Tentando se conectar ao Broker MQTT: ");
        Serial.println(BROKER_MQTT);
        if (MQTT.connect(ID_MQTT)) 
        {
            Serial.println("Conectado com sucesso ao broker MQTT!");
            MQTT.subscribe("pos");
            //MQTT.publish("acc", "true");
        } 
        else
        {
            Serial.println("Falha ao reconectar no broker.");
            Serial.println("Havera nova tentatica de conexao em 2s");
            delay(2000);
        }
    }
}

int permition = 0;
void mqtt_callback(char* topic, byte* payload, unsigned int length) 
{
    
    String msg;
 
    //obtem a string do payload recebido
    for(int i = 0; i < length; i++) 
    {
       char c = (char)payload[i];
       msg += c;
    }
    
    Serial.println();
    Serial.print("Action from actions received, under the topic name of: ");
    Serial.print(topic);
    Serial.println();
    Serial.print("Content from action is (STRING format): ");
    Serial.print(msg);
    Serial.print("Content from action is (FLOAT format): ");
    Serial.print(msg.toInt()); 
    int pos = msg.toInt();   
    Serial.println();
    Serial.println();
    if(pos == 1)
    {
      red_state = HIGH;
      green_state = LOW;
      Serial.print(" pos == 1 ");Serial.print(green_state);Serial.print(red_state);
    }
    else if(pos == 0)
    {
      red_state = LOW;
      green_state = HIGH;
      Serial.print(" pos == 0 ");Serial.print(green_state);Serial.print(red_state);
    }
    
    digitalWrite(red, red_state);
    digitalWrite(green, green_state);
    
}
 

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(red,OUTPUT);
  pinMode(green,OUTPUT);
  digitalWrite(red, LOW);
  digitalWrite(green, LOW);
  Serial.begin(115200);
 
  Serial.println("nIniciando configuração WiFin");
  initWiFi();
  initMQTT();

}

int switchState = 0; // actual read value from pin4
int oldSwitchState = 0; // last read value from pin4

void loop() {
  
  if(red_state==HIGH)
  {
    
  }

  if(green_state==HIGH)
  {

  }
  /*
  red_state = !red_state;
  green_state = !green_state;
   
  digitalWrite(red, red_state);
  digitalWrite(green, green_state);
  */
  reconnectMQTT();
  reconnectWiFi();
  
  MQTT.loop();
  
  delay(2000);  
}
