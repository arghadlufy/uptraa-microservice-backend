import { Kafka } from "kafkajs";
import "dotenv/config";
import { resend } from "./utils/email/resend.js";

export const startSendMailConsumer = async () => {
  const maxRetries = 5;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const kafka = new Kafka({
        clientId: "mail-service",
        brokers: [process.env.KAFKA_BROKER_URL!],
        retry: {
          initialRetryTime: 300,
          retries: 8,
        },
      });

      const consumer = kafka.consumer({ groupId: "mail-service-group" });
      await consumer.connect();

      const topicName = "send-mail";
      await consumer.subscribe({ topic: topicName, fromBeginning: false });

      console.log(
        `✅ [MAIL SERVICE] Consumer started, listening for ${topicName}...`
      );

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const { to, subject, html } = JSON.parse(
              message.value?.toString() || "{}"
            );

            await resend.emails.send({
              from: "Uptraa <onboarding@resend.dev>",
              to: [to],
              subject,
              html,
            });

            console.log(`Email sent to ${to}`);
          } catch (error) {
            console.error(`❌ Failed to send email`, error);
          }
        },
      });

      // Successfully connected, exit retry loop
      return;
    } catch (error) {
      retryCount++;
      console.error(
        `❌ Failed to start kafka consumer (attempt ${retryCount}/${maxRetries})`,
        error
      );

      if (retryCount >= maxRetries) {
        console.error("❌ Max retries reached. Exiting...");
        return;
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, retryCount) * 1000)
      );
    }
  }
};
