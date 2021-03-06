import { IMessage } from './discord/message';
import { inject } from '@alexlafroscia/service-locator';
import { IAdventureConfig } from './config/adventure';
import { Client, Collection, GuildMember } from 'discord.js';
import availableCommands from './config/available-commands';
import availableListeners from './config/available-listeners';
import { IGuild } from './models/Guild';

class Application {
    @inject message: IMessage;
    @inject AdventureConfig: IAdventureConfig;
    @inject client: Client | null;
    @inject guildMembers: Collection<string, GuildMember> | undefined;
    @inject guild: IGuild;

    async handleMessage() {
        // Run all message listeners
        if (this.guild.enabled === true) {
            for (const listenerConfig of availableListeners) {
                const commandInstance = new listenerConfig.class();

                await commandInstance.handle();
            };
        }

        const prefix = '-';

        if (!this.message.content().startsWith(prefix) || this.message.isFromBot()) {
            return;
        }

        const args = this.message.content().slice(prefix.length).trim().split(/ +/g);
        const command = args?.shift()?.toLowerCase()?.trim();

        if (!command) {
            return;
        }

        // Fine the matching 'route' (aka which commands file and method to call)
        const route = (availableCommands as any)[command];

        // We don't support the given command
        if (!route) {
            return;
        }

        // Create the controller, so we have a reference to the message available at all times
        const commandInstance = new route.class();

        return commandInstance[route.method](...args);
    }
}

export default Application;