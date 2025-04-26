import "env";
import DatabaseAccessor from "./model/DatabaseAccessor.ts";

const db = await DatabaseAccessor.connect();

const id = await db.StampLog.insert({
  channelId: "test_channelId",
  guildId: "test_guildId",
  messageId: "test_messageId",
  userId: "test_userId",
  userName: "test_userName",
  stampName: "test_stampName",
});

await db.StampLog.updateById(id, {
  channelId: "test!!!",
});

const targetLog = await db.StampLog.findById(id);
console.log(targetLog);

await db.StampLog.deleteById(id);

const allLog = await db.StampLog.selectAll();
console.log(allLog);

// await db.StampLog.deleteAll();
