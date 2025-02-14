import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./all.db');

export const command = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('ゴリラコインと連携します')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('ゴリラコインのユーザーネームを入力してください')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('code')
        .setDescription('発行済みの認証コードを入力してください')
        .setRequired(true)),
  async execute(interaction) {
    const username = interaction.options.getString('username');
    const code = interaction.options.getString('code');

    try {
      const response = await fetch('http://10.8.101.4:3001/authcode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username, code: Number(code) })
      });

      const data = await response.json();

      if (response.ok) {
        // テーブルが存在しなければ作成
        db.run(`
          CREATE TABLE IF NOT EXISTS account (
            discord_id TEXT PRIMARY KEY,
            token TEXT,
            username TEXT
          )
        `);

        // tokenをDBに保存
        db.run(
          `INSERT OR REPLACE INTO account (discord_id, token, username) VALUES (?, ?, ?)`,
          [interaction.user.id, data.token, username],
          (err) => {
            if (err) {
              console.error('DB書き込み中にエラーが発生しました:', err);
            } else {
              console.log('トークンをDBに保存しました');
              console.log(`discord_id: ${interaction.user.id}`);
              console.log(`token: ${data.token}`);
              console.log(`username: ${username}`);
            }
          }
        );

        const embed = new EmbedBuilder()
          .setTitle('連携成功')
          .setDescription('アカウントの連携に成功しました')
          .setFooter({ text: 'BOT ver0.0.2' })
          .setColor('#00ff00');
        await interaction.reply({ embeds: [embed] });
      } else {
        const embed = new EmbedBuilder()
          .setTitle('連携失敗')
          .setDescription(`エラー: ${data.message}`)
          .setFooter({ text: 'BOT ver0.0.2' })
          .setColor('#ff0000');
        await interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('APIリクエスト中にエラーが発生しました:', error);
      const embed = new EmbedBuilder()
        .setTitle('連携失敗')
        .setDescription('APIリクエスト中にエラーが発生しました')
        .setFooter({ text: 'BOT ver0.0.2' })
        .setColor('#ff0000');
      await interaction.reply({ embeds: [embed] });
    }
  }
};

export default command;