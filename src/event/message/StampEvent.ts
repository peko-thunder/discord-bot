import { Bot, DiscordEmbedAuthor, Message } from "discord";
import IMessageEvent from "./IMessageEvent.ts";
import fetchFileLinks from "../../storage/fetchFileLinks.ts";
import { sendImageToChannel } from "../../send/sendImageToChannel.ts";
import DatabaseAccessor from "../../model/DatabaseAccessor.ts";

/**
 * Discord スタンプ(絵文字)利用された場合のイベント
 */
export default class StampEvent implements IMessageEvent {
  /**
   * メッセージがスタンプであるかを判定する
   * @param message メッセージ
   * @returns スタンプ判定
   */
  public isTargetEvent(message: Readonly<Message>): boolean {
    return /^<:(.+):(.+)>$/.test(message.content);
  }

  public async launchEvent(
    bot: Readonly<Bot>,
    message: Readonly<Message>,
  ): Promise<void> {
    try {
      // Dropbox からスタンプ画像のリンクを取得してくる
      const stampName = this.toStampName(message);
      const imageLinks = await fetchFileLinks(stampName, `/${message.guildId}`);
      if (imageLinks.length === 0) {
        throw new Error(`Failed get file links. => ${stampName}`);
      }

      // Discord で利用されたメッセージ絵文字を削除する
      // 既に削除されている場合エラーとなるため、メッセージが存在するかの確認をした方がいい？？
      await bot.helpers.deleteMessage(message.channelId, message.id);

      // Discord にスタンプ画像を送信
      const author = await this.toEmbedAuthor(bot, message);
      await sendImageToChannel(bot, message.channelId, imageLinks, { author });

      const user = await bot.helpers.getUser(message.authorId);

      // 結果をDBに保存する
      const dbAccessor = await DatabaseAccessor.connect();
      await dbAccessor.StampLog.insert({
        channelId: String(message.channelId),
        guildId: String(message.guildId),
        messageId: String(message.id),
        userId: String(message.authorId),
        userName: user.username,
        stampName,
      });
    } catch (e) {
      // 同一Botで複数のログインセッションが存在する場合、
      // メッセージを削除後に別のランタイムで削除はできずエラーとなる
      // Deno Deploy などマルチリージョンにデプロイされる環境を想定
      const message: string = e.message;
      if (
        message.includes("Unknown Message") ||
        message.includes("10008")
      ) {
        console.log("削除対象のメッセージが見つかりませんでした");
        return;
      }
      console.error(e);
    }
  }

  /**
   * メッセージからスタンプ名を抽出する
   * @param message メッセージ
   * @returns スタンプ名
   */
  private toStampName(message: Readonly<Message>): string {
    const match = message.content.match(/:(.+):/);
    if (match === null) {
      throw new Error(`Failed match stamp name. => ${message.content}`);
    }
    return match[0].replaceAll(":", "");
  }

  /**
   * メッセージ送信時のユーザーアイコンと名前を設定する
   * @param message
   * @returns
   */
  private async toEmbedAuthor(
    bot: Readonly<Bot>,
    message: Readonly<Message>,
  ): Promise<DiscordEmbedAuthor> {
    const [user, iconURL] = await Promise.all([
      bot.helpers.getUser(message.authorId),
      this.fetchAvatarURL(bot, message),
    ]);
    const name = message.member?.nick || user.username;

    return { name, icon_url: iconURL };
  }

  private async fetchAvatarURL(
    bot: Readonly<Bot>,
    message: Readonly<Message>,
  ): Promise<string> {
    const user = await bot.helpers.getUser(message.authorId);
    const avatarURL = await bot.helpers.getAvatarURL(
      message.authorId,
      user.discriminator,
      { avatar: user.avatar },
    );

    return avatarURL;
  }
}
