import { ChannelType, PermissionFlagsBits, MessageFlags } from "discord.js";
import { emojis } from "../../resources/emojis.js";
import { defaultTicketPermissions } from "../../resources/BotPermissions.js";
import { checkBotPermissions } from "../../functions/checkPermissions.js";
import { ticketMenuRow } from "../../resources/selectMenus.js";
import { lockButtonRow } from "../../resources/buttons.js";
import { ticketContainerData } from "../../resources/ticketDefaultData.js";

export default {
	data: {
		customId: /^create-ticket-modal\|/,
	},

	execute: async ({ interaction }) => {
		if (!(await checkBotPermissions(interaction, defaultTicketPermissions)))
			return;

		const [, rawLabel] = interaction.customId.split("|");
		const label = rawLabel?.replace("label-", "").toUpperCase();
		const emoji =
			emojis.ticket.label?.[rawLabel.replace("label-", "")] ||
			emojis.ticket.label.bug;

		const ticketTitle =
			interaction.fields.getTextInputValue("ticket-title");
		const threadName = `[${label}] ${ticketTitle}`;

		const thread = await interaction.channel.threads.create({
			name: threadName,
			autoArchiveDuration: 1440,
			type: ChannelType.PrivateThread,
			reason: `${interaction.user.username} opened a thread for support`,
			invitable: false,
		});

		await interaction.reply({
			content: `# ${emoji} Created <#${thread.id}>\nNow, you can talk about your issue with our staff members.`,
			flags: MessageFlags.Ephemeral,
		});

		const container = await ticketContainerData(interaction);

		const pinMessage = await thread.send({
			components: [container, ticketMenuRow, lockButtonRow],
			flags: MessageFlags.IsComponentsV2,
		});

		await thread.members.add(interaction.user);

		if (
			interaction.guild.members.me.permissions.has(
				PermissionFlagsBits.ManageMessages,
			)
		) {
			await pinMessage.pin();
		}
	},
};
