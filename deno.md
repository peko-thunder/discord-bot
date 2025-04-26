# 環境

## 参考サイト

https://zenn.dev/uki00a/books/effective-deno/viewer/about

## インストール

https://yoshixmk.github.io/deno-manual-ja/getting_started/installation.html

windows11 以下を実行

```bash
iwr https://deno.land/x/install/install.ps1 -useb | iex
```

自動でパスが通るためコマンドを即実行可能

```bash
deno --version
```

## VS Code 拡張機能

`deno.land`提供の公式拡張機能`Deno`をインストール

Docker で Deno を実行する場合でも、IDE のサポートを受けるために PC に Deno 本体(1.13.0 以降)が必要

## VS Code 設定

参照: https://qiita.com/SuzuTomo2001/items/016b3dc606674dd1fede

# 実装

## process.env

dotenv は Deno 標準ライブラリに変更

```typescript
import "https://deno.land/std@0.191.0/dotenv/load.ts";
```

```typescript
Deno.env.get("TOKEN");
const { TOKEN } = Deno.env.toObject();
```

Deno 実行時にオプションが必要

```bash
--allow-env --allow-read
```

`.env.example`か`.env.default`がある場合、`.env`で未定義(空白)だと実行時にエラーとなる。
オプション次第で使用しないオプションであっても仮の値をセットする必要がある。

## import npm

node_modules をデフォルトで使用しないため、以下のように URL 指定で記述する
`esm.sh`などの`X-TypeScript-Types`ヘッダをサポートする CDN を利用することで、型情報のダウンロードも行ってくれる。

```typescript
import { Dropbox } from "https://esm.sh/dropbox@10.34.0";
```

各ソースにバージョンごと記載するよりパッケージ管理用 json ファイルの import_map を使う

## 実行コマンド

ライブラリ DL: allow-net
パッケージ管理： importmap

```bash
deno run --allow-net --allow-env --allow-read --importmap=import_map.json src/main.ts
```

## 削除

Deno 1.31 から npm の対応をしているが、実行環境のキャッシュに残るため一度削除かリネームすること

node_modules, package.json

## パッケージ

"mysql2": "https://esm.sh/mysql2@3.4.3",
"sequelize": "https://esm.sh/sequelize@6.32.1",
"sequelize-cli": "https://esm.sh/sequelize-cli@6.6.1",

## Discord.js

利用できるメソッドとできないメソッドがある

message.delete() : OK
channel.send() : NG

npm ではなく esm.sh 経由ならいけたかも？

```typescript
import { Client } from "npm:discord.js@14.7.1";
```

```typescript
import { Client } from "https://esm.sh/discord.js@14.13.0";
```

```bash
error: Uncaught TypeError: The URL must be of scheme file
    at fileURLToPath (node:url:1160:15)
    at getFilename (https://esm.sh/v131/@discordjs/ws@1.0.1/denonext/ws.mjs:2:2914)
    at getDirname (https://esm.sh/v131/@discordjs/ws@1.0.1/denonext/ws.mjs:2:2966)
    at https://esm.sh/v131/@discordjs/ws@1.0.1/denonext/ws.mjs:2:2987
```

```bash
TypeError: isJSONEncodable is not a function
    at file:///deno-dir/npm/registry.npmjs.org/discord.js/14.7.1/src/structures/MessagePayload.js:202:9
```

DiscordAPI に送信する JSON データの処理で利用しているメソッドが正常に読み込めていないのが原因だと思われます

```typescript
const { isJSONEncodable } = require('@discordjs/builders');
/* 中略 */
embeds: this.options.embeds?.map(embed =>
  isJSONEncodable(embed) ? embed.toJSON() : this.target.client.options.jsonTransformer(embed),
),
```

このままだと利用できないため DenoDiscord を利用することにする
Discord 系の処理を全リプレイスすることになる

## Deno Deploy

Deno 1.25 以降 npm インポートが使えるようになっているが、Deno Deploy では 20230821 時点でサポートされていない。

実際にデプロイしようとした際のエラーログ

```bash
npm: specifiers are not yet supported on Deno Deploy
```

esm.sh で使えなければ諦めるか自作するしかない

## Deno KV

使い方
https://deno.land/manual@v1.33.2/runtime/kv/operations
https://deno.land/manual@v1.33.2/runtime/kv/secondary_indexes
