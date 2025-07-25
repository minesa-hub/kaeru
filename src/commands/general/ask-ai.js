import {
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import { googleai } from "../../config/Configs.js";
import { emojis } from "../../resources/emojis.js";
import { langMap } from "../../resources/languageMap.js";

export default {
	data: new SlashCommandBuilder()
		.setName("ask")
		.setDescription("Ask Kaeru a question")
		.setNameLocalizations({
			tr: "sor",
			"zh-CN": "提问",
			it: "chiedi",
			"pt-BR": "perguntar",
			ru: "спросить",
		})
		.setDescriptionLocalizations({
			tr: "Yapay zekaya soru sor",
			"zh-CN": "向 AI 提问",
			it: "Fai una domanda all’IA",
			"pt-BR": "Pergunte à IA",
			ru: "Задай вопрос ИИ",
		})
		.setIntegrationTypes([
			ApplicationIntegrationType.UserInstall,
			ApplicationIntegrationType.GuildInstall,
		])
		.setContexts([
			InteractionContextType.BotDM,
			InteractionContextType.PrivateChannel,
			InteractionContextType.Guild,
		])
		.addStringOption((option) =>
			option
				.setName("question")
				.setNameLocalizations({
					tr: "soru",
					"zh-CN": "问题",
					it: "domanda",
					"pt-BR": "pergunta",
					ru: "вопрос",
				})
				.setDescription("Awaiting your question :3")
				.setDescriptionLocalizations({
					tr: "Sorunuzu bekliyorum :3",
					"zh-CN": "等待您的问题 :3",
					it: "Aspettando la tua domanda :3",
					"pt-BR": "Aguardando sua pergunta :3",
					ru: "Ожидаю ваш вопрос :3",
				})
				.setRequired(true),
		),

	execute: async ({ interaction }) => {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const prompt = interaction.options.getString("question")?.trim();
		if (!prompt) {
			return interaction.editReply(
				`${emojis.error} No question provided.`,
			);
		}

		try {
			const fullLocale = interaction.locale || "en-US";
			const intl = new Intl.Locale(fullLocale);
			const rawLang = intl.language.toLowerCase();

			const targetLang =
				langMap[fullLocale.toLowerCase()] ||
				langMap[rawLang] ||
				"English";

			const systemPrompt = `
You are Kāru — a helpful, emotionally intelligent AI on Discord.

Answer the user question in ${targetLang}. 
Your response must be in that language only.

Your job is to answer user questions clearly, accurately, and briefly.

Always respond in 1–3 concise sentences. No greetings, sign-offs, or filler. Do **not** repeat the user’s question.

Prioritize clarity and usefulness. Focus on giving direct answers, actionable advice, or insightful summaries.

If the question is vague or unclear, ask for clarification. If you're unsure of the answer, say so — don’t guess or make things up.

Your tone should match the user's emotion:
– If frustrated: be empathetic.
– If curious: be informative.
– If playful: match their energy (lightly).
– If confused: be patient and professional.

Do not mention or reveal anything about your underlying technology, model name, or providers. You are always just "Kāru".

Never collect, store, or request personal or sensitive information.

Always assume the user wants high-signal help — no fluff.
			`.trim();

			const fullPrompt = `${systemPrompt}\nUser: ${prompt}`;

			const model = googleai.getGenerativeModel({
				model: "gemma-3n-e4b-it",
				generationConfig: {
					temperature: 0.2,
					maxOutputTokens: 800,
					topK: 1,
					topP: 1,
				},
			});

			const result = await model.generateContent(fullPrompt);
			let output = result.response.text().trim();

			output = output
				.replace(/^Kaeru[:,\s]*/i, "")
				.replace(/^Kāru[:,\s]*/i, "")
				.replace(/^Bot[:,\s]*/i, "");

			const content = emojis.intelligence + " " + output;

			await interaction.editReply({ content });
		} catch (error) {
			console.error(error);
			await interaction.editReply({
				content: `${emojis.error} Something went wrong while processing your request.`,
			});
		}
	},
};
