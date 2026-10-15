import type { PostConfirmationTriggerHandler } from "aws-lambda";
import { upsertUser } from "../../models/users.js";

export const handler: PostConfirmationTriggerHandler = async (event) => {
  const { sub, email } = event.request.userAttributes;
  if (sub && email) {
    await upsertUser(sub, email);
  }
  return event;
};
