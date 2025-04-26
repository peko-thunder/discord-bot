import "env";
import { StampLogModel } from "./StampLogModel.ts";

const { DENO_KV_DATABASE_ID } = Deno.env.toObject();

/**
 * データベースアクセス用クラス
 */
export default class DatabaseAccessor {
  public readonly kv: Deno.Kv;
  public readonly StampLog: StampLogModel;

  private constructor(kv: Deno.Kv) {
    this.kv = kv;
    this.StampLog = new StampLogModel(kv);
  }

  static async connect(): Promise<DatabaseAccessor> {
    try {
      const kv = await Deno.openKv(
        `https://api.deno.com/databases/${DENO_KV_DATABASE_ID}/connect`,
      );

      return new this(kv);
    } catch (e: any) {
      console.error(e);
      throw new Error("DBとの接続に失敗しました");
    }
  }
}
