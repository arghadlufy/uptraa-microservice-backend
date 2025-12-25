import { Kafka, type Producer, type Admin } from "kafkajs";
import "dotenv/config";

let producer: Producer;
let admin: Admin;

export const connectKafka = async () => {
  try {
    const kafka = new Kafka({
      clientId: "auth-service",
      brokers: [process.env.KAFKA_BROKER_URL!],
      retry: {
        initialRetryTime: 300,
        retries: 8,
      },
    });

    admin = kafka.admin();
    await admin.connect();

    const topics = await admin.listTopics();
    if (!topics.includes("send-mail")) {
      await admin.createTopics({
        topics: [
          { topic: "send-mail", numPartitions: 1, replicationFactor: 1 },
        ],
      });
      console.log("✅ [AUTH SERVICE] Topic 'send-mail' created successfully");
    }

    await admin.disconnect();

    producer = kafka.producer();
    await producer.connect();

    console.log("✅ [AUTH SERVICE] Kafka producer connected successfully");
  } catch (error) {
    console.error(
      "❌ [AUTH SERVICE] Failed to connect to Kafka producer",
      error
    );
  }
};

export const publistToTopic = async (topic: string, message: any) => {
  if (!producer) {
    console.log("❌ [AUTH SERVICE] Kafka producer is not initialized");
    return;
  }

  try {
    await producer.send({
      topic,
      messages: [
        {
          value: JSON.stringify(message),
        },
      ],
    });
    console.log(`✅ [AUTH SERVICE] Message published to topic ${topic}`);
  } catch (error) {
    console.error(
      `❌ [AUTH SERVICE] Failed to publish message to topic ${topic}`,
      error
    );
  }
};

export const disconnectKafka = async () => {
  if (producer) {
    producer.disconnect();
    console.log("✅ [AUTH SERVICE] Kafka producer disconnected successfully");
  }
};
