import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./all.db');
const api_url = 'http://10.8.101.3:3000'; // 必要に応じて変更してください

export const command = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('残高を確認します'),
  async execute(interaction) {
    db.get(
      'SELECT token FROM account WHERE discord_id = ?',
      [interaction.user.id],
      async (err, row) => {
        if (err) {
          console.error('トークン取得エラー:', err);
          return;
        }
        if (!row) {
          console.log('連携が見つかりません');
          return;
        }

        const token = row.token;

        try {
          const response = await fetch(`${api_url}/get_balance`, {
            method: 'GET',
            headers: {
              'Authorization': token
            }
          });

          const data = await response.json();

          if (response.ok) {
            const member = await interaction.guild?.members.fetch(interaction.user.id);
            const displayName = member ? member.displayName : interaction.user.username;

            const embed = new EmbedBuilder()
              .setTitle('残高')
              .setDescription(`${displayName}の残高は、${data.balance.toLocaleString()}ゴリラコインです。`)
              .setColor('#009990');
            await interaction.reply({ embeds: [embed] });
          } else {
            const embed = new EmbedBuilder()
              .setTitle('エラー')
              .setDescription(`残高取得中にエラーが発生しました: ${data.message}`)
              .setColor('#ff0000');
            await interaction.reply({ embeds: [embed] });
          }
        } catch (error) {
          console.error('APIリクエスト中にエラーが発生しました:', error);
          const embed = new EmbedBuilder()
            .setTitle('エラー')
            .setDescription('APIリクエスト中にエラーが発生しました')
            .setColor('#ff0000');
          await interaction.reply({ embeds: [embed] });
        }
      }
    );
  }
};

export default command;