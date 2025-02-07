import { AttachmentBuilder, SlashCommandBuilder } from 'discord.js';
import { registerFont, createCanvas, loadImage } from 'canvas';
import fetch from 'node-fetch';
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./all.db');
const api_url = 'http://10.8.101.3:3000'; // 必要に応じて変更してください

registerFont('./assets/Roboto.ttf', { family: 'Roboto' });

function splitCommentByWidth(str, maxFullWidthChars) {
  const lines = [];
  let currentLine = '';
  let currentWidth = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (char === '<' && str.slice(i, i + 4) === '<br>') {
      lines.push(currentLine);
      currentLine = '';
      currentWidth = 0;
      i += 3; 
      continue;
    }

    const w = /[\u0000-\u00FF]/.test(char) ? 0.55 : 1;
    if (currentWidth + w > maxFullWidthChars) {
      lines.push(currentLine);
      currentLine = '';
      currentWidth = 0;
    }
    currentLine += char;
    currentWidth += w;
  }

  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

export const command = {
  data: new SlashCommandBuilder()
    .setName('superchat')
    .setDescription('スパチャを送れます')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('スパチャの金額を入力してください 青色(100~199) 緑色(~499) 黄色(~999) オレンジ色(~1999) 赤色(~4999) ピンク色(~9999) 赤色(10000~)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('comment')
        .setDescription('スパチャのコメントを入力してください'))
    .addUserOption(option =>
      option.setName('user')
        .setDescription('スーパチャットを送るユーザーを選択してください')),
  async execute(interaction) {
    const avatarURL = interaction.user.displayAvatarURL({ extension: 'png' });
    const avatarImage = await loadImage(avatarURL);
    const amount = interaction.options.getInteger('amount');
    const username = interaction.options.getUser('user');
    let comment = interaction.options.getString('comment') || '';

    comment = comment.replace(/#/g, '\\#');
    comment = comment.replace(/\r/g, '');
    comment = comment.replace(/\n/g, '');
    comment = comment.replace(/\r\n/g, '');
    comment = comment.replace(/\u202E/g, '');

    let sendBackGroundColor, upperColor, footerColor, moneyColor, nameColor = '';

    // 全角換算20文字くらいで改行
    const comments = splitCommentByWidth(comment, 20);

    console.log(comment);
    console.log(comments);

    if (amount >= 10000) {
      sendBackGroundColor = '#990000';
      upperColor = '#d00000ff';
      footerColor = '#e62117ff';
      moneyColor = '#ffffffff';
      nameColor = '#ffffffb3';
    } else if (amount >= 5000) {
      sendBackGroundColor = '#991e63';
      upperColor = '#c2185bff';
      footerColor = '#e91e63ff';
      moneyColor = '#ffffffff';
      nameColor = '#ffffffb3';
    } else if (amount >= 2000) {
      sendBackGroundColor = '#b23e00'; 
      upperColor = '#e65100ff';
      footerColor = '#f57c00ff';
      moneyColor = '#ffffffdf';
      nameColor = '#ffffffb3';
    } else if (amount >= 1000) {
      sendBackGroundColor = '#b68600';
      upperColor = '#ffb300ff';
      footerColor = '#ffca28ff';
      moneyColor = '#000000df';
      nameColor = '#0000008a';
    } else if (amount >= 500) {
      sendBackGroundColor = '#009990';
      upperColor = '#00bfa5ff';
      footerColor = '#1de9b6ff';
      moneyColor = '#000000ff';
      nameColor = '#0000008a';
    } else if (amount >= 200) {
      sendBackGroundColor = '#007e91';
      upperColor = '#00b8d4ff';
      footerColor = '#00e5ffff';
      moneyColor = '#000000ff';
      nameColor = '#000000b3';
    } else if (amount >= 100) {
      sendBackGroundColor = '#0f4d94';
      upperColor = '#1565c0ff';
      footerColor = '#1e88e5ff';
      moneyColor = '#ffffffff';
      nameColor = '#ffffffb3';
    } else {
      return interaction.reply({ content: '100円以上で入力してください', ephemeral: true });
    }

    // ユーザーが指定されている場合, DBからrecieverを取得して送金
    if (username !== null) {
      db.get(
        'SELECT token FROM account WHERE discord_id = ?',
        [interaction.user.id],
        (err, speakerRow) => {
          if (err) {
            console.error('トークン取得エラー:', err);
            return;
          }
          if (!speakerRow) {
            console.log('発言者の連携が見つかりません');
            return;
          }

          const speakerToken = speakerRow.token;

          db.get(
            'SELECT username FROM account WHERE discord_id = ?',
            [username.id],
            async (err, recRow) => {
              if (err) {
                console.error('レシーバー取得エラー:', err);
                return;
              }
              if (!recRow) {
                console.log('受取側の連携が見つかりません');
                return;
              }

              try {
                await fetch(`${api_url}/transfer_money`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': speakerToken
                  },
                  body: JSON.stringify({
                    reciever: recRow.username,
                    amount: amount,
                    description: 'スーパーチャット'
                  })
                });
              } catch (e) {
                console.error('送金APIエラー:', e);
              }
            }
          );
        }
      );

      if (comments.length === 0) {
        // キャンバスの作成
        const sendheight = 30;

        const canvas = createCanvas(400, 60+sendheight);
        const context = canvas.getContext('2d');
  
        // 上の色
        context.fillStyle = upperColor;
        context.fillRect(0, 0, canvas.width, canvas.height);

        //送信先の背景色
        context.fillStyle = sendBackGroundColor;
        context.fillRect(0, 0, canvas.width, sendheight);

        //送信先の名前
        context.font = "15px 'Roboto'";
        context.fillStyle = nameColor;
        context.fillText("To", 20, 20);
        context.fillText((await interaction.guild?.members.fetch(username.id)).displayName, 40, 20);

        // アイコン
        context.save();
        context.beginPath();
        context.arc(40, canvas.height - 30, 20, 0, Math.PI * 2);
        context.closePath();
        context.clip();
        context.drawImage(avatarImage, 20, canvas.height - 50, 40, 40);
        context.restore();
  
        // ユーザーネーム
        context.font = "18px 'Roboto'";
        context.fillStyle = nameColor;
        context.fillText((await interaction.guild?.members.fetch(interaction.user.id)).displayName, 80, canvas.height - 35);
  
        // 金額
        context.font = "18px 'Roboto'";
        context.fillStyle = moneyColor;
        context.fillText(`${amount.toLocaleString()}ゴリラコイン`, 80, canvas.height - 15);
  
        // キャンバスの生成
        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'superchat.png' });
        await interaction.reply({ files: [attachment] });
      } else { //ユーザーが指定されていて、コメントがある場合
        // キャンバスの作成
        const sendheight = 30;

        const canvas = createCanvas(400, 90 + comments.length * 20 + sendheight);
        const context = canvas.getContext('2d');
  
        // 上の色
        context.fillStyle = upperColor;
        context.fillRect(0, 0, canvas.width, canvas.height);

        //送信先の背景色
        context.fillStyle = sendBackGroundColor;
        context.fillRect(0, 0, canvas.width, sendheight);

        //送信先の名前
        context.font = "15px 'Roboto'";
        context.fillStyle = nameColor;
        context.fillText("To", 20, 20);
        context.fillText((await interaction.guild?.members.fetch(username.id)).displayName, 40, 20);
  
        // 下の色
        context.fillStyle = footerColor;
        context.fillRect(0, canvas.height - 30 - comments.length * 20, canvas.width, 30 + comments.length * 20);
  
        // アイコン
        context.save();
        context.beginPath();
        context.arc(40, canvas.height - 60 - comments.length * 20, 20, 0, Math.PI * 2);
        context.closePath();
        context.clip();
        context.drawImage(avatarImage, 20, canvas.height - 80 - comments.length * 20, 40, 40);
        context.restore();
  
        // ユーザーネーム
        context.font = "18px 'Roboto'";
        context.fillStyle = nameColor;
        context.fillText((await interaction.guild?.members.fetch(interaction.user.id)).displayName, 80, canvas.height - 60 - comments.length * 20);
  
        // 金額
        context.font = "18px 'Roboto'";
        context.fillStyle = moneyColor;
        context.fillText(`${amount.toLocaleString()}ゴリラコイン`, 80, canvas.height - 40 - comments.length * 20);
  
        // コメント
        context.font = "18px 'Roboto'";
        context.fillStyle = moneyColor;
        for (let i = 0; i < comments.length; i++) {
          context.fillText(comments[i], 20, canvas.height - comments.length * 20 + 20 * i);
        }
  
        // キャンバスの生成
        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'superchat.png' });
        await interaction.reply({ files: [attachment] });
      }
    } else if (comments.length === 0) {
      // キャンバスの作成
      const canvas = createCanvas(400, 60);
      const context = canvas.getContext('2d');

      // 上の色
      context.fillStyle = upperColor;
      context.fillRect(0, 0, canvas.width, canvas.height);

      // アイコン
      context.save();
      context.beginPath();
      context.arc(40, canvas.height - 30, 20, 0, Math.PI * 2);
      context.closePath();
      context.clip();
      context.drawImage(avatarImage, 20, canvas.height - 50, 40, 40);
      context.restore();

      // ユーザーネーム
      context.font = "18px 'Roboto'";
      context.fillStyle = nameColor;
      context.fillText((await interaction.guild?.members.fetch(interaction.user.id)).displayName, 80, canvas.height - 35);

      // 金額
      context.font = "18px 'Roboto'";
      context.fillStyle = moneyColor;
      context.fillText(`${amount.toLocaleString()}ゴリラコイン`, 80, canvas.height - 15);

      // キャンバスの生成
      const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'superchat.png' });
      await interaction.reply({ files: [attachment] });
    } else {
      // キャンバスの作成
      const canvas = createCanvas(400, 90 + comments.length * 20);
      const context = canvas.getContext('2d');

      // 上の色
      context.fillStyle = upperColor;
      context.fillRect(0, 0, canvas.width, canvas.height);

      // 下の色
      context.fillStyle = footerColor;
      context.fillRect(0, canvas.height - 30 - comments.length * 20, canvas.width, 30 + comments.length * 20);

      // アイコン
      context.save();
      context.beginPath();
      context.arc(40, canvas.height - 60 - comments.length * 20, 20, 0, Math.PI * 2);
      context.closePath();
      context.clip();
      context.drawImage(avatarImage, 20, canvas.height - 80 - comments.length * 20, 40, 40);
      context.restore();

      // ユーザーネーム
      context.font = "18px 'Roboto'";
      context.fillStyle = nameColor;
      context.fillText((await interaction.guild?.members.fetch(interaction.user.id)).displayName, 80, canvas.height - 60 - comments.length * 20);

      // 金額
      context.font = "18px 'Roboto'";
      context.fillStyle = moneyColor;
      context.fillText(`${amount.toLocaleString()}ゴリラコイン`, 80, canvas.height - 40 - comments.length * 20);

      // コメント
      context.font = "18px 'Roboto'";
      context.fillStyle = moneyColor;
      for (let i = 0; i < comments.length; i++) {
        context.fillText(comments[i], 20, canvas.height - comments.length * 20 + 20 * i);
      }

      // キャンバスの生成
      const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'superchat.png' });
      await interaction.reply({ files: [attachment] });
    }
  }
};

export default command;