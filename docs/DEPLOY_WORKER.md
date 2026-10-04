# Cloudflare Workers デプロイ手順書

本プロジェクトの定期天気通知サービス（Cloudflare Workers）のデプロイ手順です。
無料枠内で永続的に稼働し、毎朝7:00（JST）に自動で最新の天気・前日差・特記事項を集計してプッシュ通知を配信します。

## 前提条件

- Cloudflareアカウント（無料プランで問題ありません）
- Node.js 20以上がインストールされていること

## コマンドでのデプロイ手順

### Cloudflareへのログイン

ターミナルで `worker` ディレクトリに移動し、Cloudflareにログインします。

```bash
# worker ディレクトリで実行
npx wrangler login
```

ブラウザが自動的に開き、Cloudflareの認証画面が表示されます。「承認」をクリックしてログインを完了してください。

※ ブラウザ操作を挟まず完全コマンドラインで自動化したい場合は、Cloudflareダッシュボードで発行したAPIトークンを環境変数 `CLOUDFLARE_API_TOKEN` に設定してデプロイできます。

### 通知トークン保存用KVネームスペースの作成

プッシュ通知の宛先端末（Expo Push Token）を永続化するためのKVストレージを作成します。

```bash
npx wrangler kv namespace create PUSH_TOKENS
```

実行すると、ターミナルに以下のような設定出力が表示されます。

```toml
[[kv_namespaces]]
binding = "PUSH_TOKENS"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 設定ファイルの更新

表示された `id` を [worker/wrangler.toml](file:///d:/Data/projects/software/weather-dashboard/worker/wrangler.toml) の `[[kv_namespaces]]` セクションにある `id` の値に反映します。

```toml
[[kv_namespaces]]
binding = "PUSH_TOKENS"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### デプロイの実行

以下のコマンドを実行してワーカーをCloudflareへデプロイします。

```bash
npm run deploy
```

デプロイが成功すると、公開URL（例: `https://weather-notification-worker.<your-subdomain>.workers.dev`）が表示されます。

## デプロイ後の動作確認

デプロイされたURLに対してリクエストを送信して確認します。

### ヘルスチェック・通知プレビューの確認

ブラウザまたはcurlで公開URLにアクセスします。

```bash
curl https://<your-worker-url>.workers.dev/
```

最新の天気概況、前日差、服装目安、特記事項が含まれたJSONが返却されれば正常稼働しています。

### テスト通知の送信確認

```bash
curl -X POST https://<your-worker-url>.workers.dev/send-test \
  -H "Content-Type: application/json" \
  -d '{"token": "ExponentPushToken[実機のトークン]", "cityId": "tokyo"}'
```

端末にプッシュ通知が届くことを確認します。

## スケジュール実行（Cron）について

[worker/wrangler.toml](file:///d:/Data/projects/software/weather-dashboard/worker/wrangler.toml) に以下の設定が含まれています。

```toml
[triggers]
crons = ["0 22 * * *"]
```

UTC 22:00（日本時間 07:00）に自動トリガーされ、登録されている全端末へ毎朝最新の気象庁データ・前日比・特記事項が配信されます。
配信時刻を変更したい場合は、このCron式を変更して再度 `npm run deploy` を実行してください。
