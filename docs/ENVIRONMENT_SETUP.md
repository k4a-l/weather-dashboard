# Android環境整備・自動検証ガイド

Android実機およびエミュレータでの動作・通知確認手順と環境整備ガイド。

## 開発環境一覧

- **Node.js**: v22.23.1
- **Java (JDK)**: 17.0.17
- **Android Debug Bridge (adb)**: 1.0.41 (`C:\Users\nano\AppData\Local\Android\Sdk\platform-tools\adb.exe`)
- **Android Emulator**: インストール済み
- **作成済みAVD（仮想端末）**: `Pixel_6_API_36`

## Androidエミュレータによる検証

### エミュレータの起動

PowerShellで以下を実行して起動。

```powershell
& "C:\Users\nano\AppData\Local\Android\Sdk\emulator\emulator.exe" -avd Pixel_6_API_36
```

### 自動検証項目

エミュレータ起動状態で以下の検証が可能。

- `adb` 経由のアプリ自動起動・画面遷移
- `adb shell screencap -p` によるUI確認
- `adb logcat` によるランタイムエラー検知
- 通知センター展開状態の表示確認

## 実機へのインストール手順（スタンドアロン版 APK）

### 事前準備: リリースAPKのビルド

最新コードを反映したAPKパッケージを作成。PowerShellで実行。

```powershell
cd D:\Data\projects\software\weather-dashboard\app\android
.\gradlew.bat assembleRelease
```

ビルド完了後のAPK出力先:
`D:\Data\projects\software\weather-dashboard\app\android\app\build\outputs\apk\release\app-release.apk`

### USB接続（adb）経由での一発インストール（推奨）

PCとAndroidスマートフォンをUSB接続し、USBデバッグが有効な場合の手順。

#### 接続確認

PowerShellで接続デバイスを確認。

```powershell
adb devices
```

一覧に対象端末（例: `c3b95b8a`）が表示されていることを確認。

#### APKの転送・インストール

アプリデータを保持したまま上書きインストール。

```powershell
# デバイスが1台のみ接続されている場合
adb install -r "D:\Data\projects\software\weather-dashboard\app\android\app\build\outputs\apk\release\app-release.apk"

# 複数デバイス接続時（デバイスID指定）
adb -s <デバイスID> install -r "D:\Data\projects\software\weather-dashboard\app\android\app\build\outputs\apk\release\app-release.apk"
```

### ファイル共有による手動インストール

PCとスマホをUSB接続しない場合の手順。

#### ファイル転送

出力された `app-release.apk` をスマートフォンへ転送。

- Google ドライブや OneDrive などのクラウドストレージ経由
- USBファイル転送モード（MTP）でダウンロードフォルダへ直接コピー
- ローカル共有経由

#### 端末でのインストール実行

- スマートフォンの「ファイル」アプリ等から `app-release.apk` を開く。
- 「提供元不明のアプリ」警告が出た場合、該当ファイル管理アプリからのインストールを許可。
- 「天気盤」のインストールまたは更新を実行。

### インストール後の推奨設定（通知・バックグラウンド動作の安定化）

Androidの省電力制限による通知遅延を防ぎ、起床連動通知を確実に届けるための設定。

- **通知権限の許可**
    - 初回起動時の通知許可ダイアログで「許可」を選択。
- **バッテリー最適化の除外**
    - ホーム画面の **「天気盤」** アイコンを長押し →「アプリ情報」を開く。
    - 「バッテリー」または「アプリのバッテリー使用量」を選択。
    - 「最適化」から **「制限なし」** に変更。
- **通知のテスト**
    - アプリ右上のギアアイコンをタップして設定モーダルを開く。
    - 「通知をテスト」をタップし、ステータスバーに通知が即座に表示されることを確認。
