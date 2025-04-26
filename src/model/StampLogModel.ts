import { IModel } from "./IModel.ts";

export interface StampLogRecord {
  id: string;
  channelId: string;
  guildId: string;
  messageId: string;
  userId: string;
  userName: string;
  stampName: string;
  createdAt: Date;
}

export class StampLogModel implements IModel {
  public readonly keyName = "stamp_logs";

  constructor(public readonly kv: Deno.Kv) {}

  public async insert(
    param: Omit<StampLogRecord, "id" | "createdAt">,
  ): Promise<string> {
    const record: StampLogRecord = {
      id: crypto.randomUUID(),
      ...param,
      createdAt: new Date(),
    };

    try {
      const primaryKey = [this.keyName, record.id];
      const res = await this.kv.atomic()
        .check({ key: primaryKey, versionstamp: null })
        .set(primaryKey, record)
        .commit();
      if (!res.ok) {
        throw new Error("レコードのIDが重複したため、追加処理できませんでした");
      }

      return record.id;
    } catch (e: any) {
      console.error(e);
      throw new Error("レコード追加に失敗しました");
    }
  }

  public async updateById(
    id: string,
    param: Partial<Omit<StampLogRecord, "id" | "createdAt">>,
  ): Promise<void> {
    try {
      const getRes = await this.kv.get<StampLogRecord>([this.keyName, id]);
      if (getRes === null) {
        throw new Error("更新レコードが見つかりませんでした");
      }
      const updatedRecord = { ...getRes.value, ...param };
      const primaryKey = [this.keyName, id];
      const setRes = await this.kv.atomic()
        .check(getRes)
        .set(primaryKey, updatedRecord)
        .commit();
      if (!setRes.ok) {
        throw new Error(
          "更新レコードが既に更新されているため、更新処理をキャンセルします",
        );
      }
    } catch (e: any) {
      console.error(e);
      throw new Error("レコード追加に失敗しました");
    }
  }

  public async findById(id: string): Promise<StampLogRecord | null> {
    try {
      const res = await this.kv.get<StampLogRecord>([this.keyName, id]);
      return res.value;
    } catch (e) {
      console.error(e);
      throw new Error("レコード検索に失敗しました");
    }
  }

  public async deleteById(id: string): Promise<void> {
    try {
      const getRes = await this.kv.get<StampLogRecord>([this.keyName, id]);
      if (getRes === null) {
        throw new Error("削除レコードが見つかりませんでした");
      }
      const deleteRes = await this.kv.atomic()
        .check(getRes)
        .delete([this.keyName, id])
        .commit();
      if (!deleteRes.ok) {
        throw new Error("削除レコードは既に存在していません");
      }
    } catch (e) {
      console.error(e);
      throw new Error("レコード削除に失敗しました");
    }
  }

  public async deleteAll(): Promise<void> {
    try {
      const listResponse = await this.kv.list<StampLogRecord>({
        prefix: [this.keyName],
      });
      const stampLogs: Deno.KvEntry<StampLogRecord>[] = [];
      for await (const entry of listResponse) stampLogs.push(entry);
      if (stampLogs.length === 0) return;

      const transaction = stampLogs.reduce(
        (trx, stampLog) =>
          trx.check(stampLog).delete([this.keyName, stampLog.value.id]),
        this.kv.atomic(),
      );
      const deleteRes = await transaction.commit();
      if (!deleteRes.ok) {
        throw new Error("削除レコードは既に存在していません");
      }
    } catch (e) {
      console.error(e);
      throw new Error("レコード全削除に失敗しました");
    }
  }

  public async selectAll(): Promise<StampLogRecord[]> {
    try {
      const listResponse = await this.kv.list<StampLogRecord>({
        prefix: [this.keyName],
      });
      const stampLogs: StampLogRecord[] = [];
      for await (const entry of listResponse) stampLogs.push(entry.value);

      return stampLogs;
    } catch (e) {
      console.error(e);
      throw new Error("レコード全取得に失敗しました");
    }
  }
}
