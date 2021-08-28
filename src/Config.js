const merge = require("deepmerge");
const Discord = require("discord.js");
const serialize = require("serialize-javascript");
const lodash = require("lodash");
const { EventEmitter } = require("events");
const { ConfigOptions, ConfigData, ConfigEditOptions } = require("./Constants.js");
const VoiceManager = require("./Manager.js");

/**
 * Represents a Config
 */
class Config extends EventEmitter {
    /**
     * @param {VoiceManager} manager The Voice Manager
     * @param {ConfigData} options The config options
     */
    constructor(manager, options) {
        super();
        /**
         * The Voice Manager
         * @type {VoiceManager}
         */
        this.manager = manager;
        /**
         * The guild Id of the config
         * @type {Snowflake}
         */
        this.guildId = options.guildId;
        /**
         * The config data
         * @type {ConfigOptions}
         */
        this.options = options.data;
    }

    /**
     * Whether bots are able to be tracked.
     * @type {Boolean}
     */
    get trackBots() {
        return this.options.trackBots || this.manager.options.default.trackBots;
    }

    /**
     * Whether to track all of the guild's voice channels.
     * @type {Boolean}
     */
    get trackMute() {
        return this.options.trackMute || this.manager.options.default.trackMute;
    }

    /**
     * Whether members who are deafened should be tracked.
     * @type {Boolean}
     */
    get trackDeaf() {
        return this.options.trackDeaf || this.manager.options.default.trackDeaf;
    }

    /**
     * Whether the bots are able to be tracked
     * @type {Boolean}
     */
    get trackAllChannels() {
        return this.options.trackAllChannels || this.manager.options.default.trackAllChannels;
    }

    /**
     * The channels to track (if trackAllChannels is true this will be ignored).
     * @type {Snowflake[]}
     */
    get channelIds() {
        return this.options.channelIds || this.manager.options.default.channelIds;
    }

    /**
     * The min amount of users to be in a channel to be tracked (0 is equal to no limit).
     * @type {Number}
     */
    get minUserCountToParticipate() {
        return this.options.minUserCountToParticipate || this.manager.options.default.minUserCountToParticipate;
    }

    /**
     * The max amount of users to be in a channel to be tracked uptil (0 is equal to no limit).
     * @type {Number}
     */
    get maxUserCountToParticipate() {
        return this.options.maxUserCountToParticipate || this.manager.options.default.maxUserCountToParticipate;
    }

    /**
     * The min amount of xp the user needs to have to be tracked (0 is equal to no limit).
     * @type {Number}
     */
    get minXpToParticipate() {
        return this.options.minXpToParticipate || this.manager.options.default.minXpToParticipate;
    }

    /**
     * The min amount of level the user needs to have to be tracked (0 is equal to no limit).
     * @type {Number}
     */
    get minLevelToParticipate() {
        return this.options.minLevelToParticipate || this.manager.options.default.minLevelToParticipate;
    }

    /**
     * The max amount of xp the user can be tracked uptil (0 is equal to no limit).
     * @type {Number}
     */
    get maxXpToParticipate() {
        return this.options.maxXpToParticipate || this.manager.options.default.maxXpToParticipate;
    }

    /**
     * The max amount of level the user can be tracked uptil (0 is equal to no limit).
     * @type {Number}
     */
    get maxLevelToParticipate() {
        return this.options.maxLevelToParticipate || this.manager.options.default.maxLevelToParticipate;
    }

    /**
     * Whether the voice time tracking module is enabled.
     * @type {Boolean}
     */
    get voiceTimeTrackingEnabled() {
        return this.options.voiceTimeTrackingEnabled || this.manager.options.default.voiceTimeTrackingEnabled;
    }

    /**
     * Whether the leveling tracking module is enabled.
     * @type {Boolean}
     */
    get levelingTrackingEnabled() {
        return this.options.levelingTrackingEnabled || this.manager.options.default.levelingTrackingEnabled;
    }

    /**
     * The raw config object for this guild's config.
     * @type {ConfigData}
     */
    get data() {
        const baseData = {
            guildId: this.guildId,
            data: {
                trackBots: this.options.trackBots,
                trackAllChannels: this.options.trackAllChannels,
                exemptChannels: !this.options.exemptChannels || typeof this.options.exemptChannels === "string" ? this.options.exemptChannels : serialize(this.options.exemptChannels),
                channelIds: this.options.channelIds,
                exemptPermissions: this.options.exemptPermissions,
                exemptMembers: !this.options.exemptMembers || typeof this.options.exemptMembers === "string" ? this.options.exemptMembers : serialize(this.options.exemptMembers),
                trackMute: this.options.trackMute,
                trackDeaf: this.options.trackDeaf,
                isEnabled: this.options.isEnabled,
                minUserCountToParticipate: this.options.minUserCountToParticipate,
                maxUserCountToParticipate: this.options.maxUserCountToParticipate,
                minXpToParticipate: this.options.minXpToParticipate,
                minLevelToParticipate: this.options.minLevelToParticipate,
                maxXpToParticipate: this.options.maxXpToParticipate,
                maxLevelToParticipate: this.options.maxLevelToParticipate,
                xpAmountToAdd: !this.options.xpAmountToAdd || typeof this.options.xpAmountToAdd === "string" ? this.options.xpAmountToAdd : serialize(this.options.xpAmountToAdd),
                voiceTimeToAdd: !this.options.voiceTimeToAdd || typeof this.options.voiceTimeToAdd === "string" ? this.options.voiceTimeToAdd : serialize(this.options.voiceTimeToAdd),
                voiceTimeTrackingEnabled: this.options.voiceTimeTrackingEnabled,
                levelingTrackingEnabled: this.options.levelingTrackingEnabled,
                levelMultiplier: !this.options.levelMultiplier || typeof this.options.levelMultiplier === "string" ? this.options.levelMultiplier : serialize(this.options.levelMultiplier)
            }
        };
        return baseData;
    }

    /**
     * Members with any of these permissions won't be tracked.
     * @type {PermissionResolvable[]}
     */
    get exemptPermissions() {
        return Array.isArray(this.options.exemptPermissions) && this.options.exemptPermissions.length ? this.options.exemptPermissions : this.manager.options.default.exemptPermissions;
    }

    /**
     * The exemptMembers function
     * @type {Function}
     */
    get exemptMembersFunction() {
        return this.options.exemptMembers ? (typeof this.options.exemptMembers === "string" && this.options.exemptMembers.includes("function anonymous") ? eval(`(${this.options.exemptMembers})`) : eval(this.options.exemptMembers)) : null;
    }

    /**
     * The exemptChannels function
     * @type {Function}
     */
    get exemptChannelsFunction() {
        return this.options.exemptChannels ? (typeof this.options.exemptChannels === "string" && this.options.exemptChannels.includes("function anonymous") ? eval(`(${this.options.exemptChannels})`) : eval(this.options.exemptChannels)) : null;
    }

    /**
     * The xpAmountToAdd function
     * @type {Function}
     */
    get xpAmountToAddFunction() {
        return this.options.xpAmountToAdd ? (typeof this.options.xpAmountToAdd === "string" && this.options.xpAmountToAdd.includes("function anonymous") ? eval(`(${this.options.xpAmountToAdd})`) : eval(this.options.xpAmountToAdd)) : null;
    }

    /**
     * The voiceTimeToAdd function
     * @type {Function}
     */
    get voiceTimeToAddFunction() {
        return this.options.voiceTimeToAdd ? (typeof this.options.voiceTimeToAdd === "string" && this.options.voiceTimeToAdd.includes("function anonymous") ? eval(`(${this.options.voiceTimeToAdd})`) : eval(this.options.voiceTimeToAdd)) : null;
    }

    /**
     * The levelMultiplier function
     * @type {Function}
     */
    get levelMultiplierFunction() {
        return this.options.levelMultiplier ? (typeof this.options.levelMultiplier === "string" && this.options.levelMultiplier.includes("function anonymous") ? eval(`(${this.options.levelMultiplier})`) : eval(this.options.levelMultiplier)) : null;
    }

    /**
     * Function to filter members. If true is returned, the member won't be tracked.
     * @property {GuildMember} member The member to check
     * @returns {Promise<boolean>}
     */
    async exemptMembers(member) {
        if (typeof this.exemptMembersFunction === "function") {
            try {
                const result = await this.exemptMembersFunction(member);
                return result;
            } catch (err) {
                console.error(`User Id: ${member.id}\nGuild Id: ${this.guildId}\nChannel Id: ${member.voice.channel.id}\n${serialize(this.exemptMembersFunction)}\n${err}`);
                return false;
            }
        }
        if (typeof this.manager.options.default.exemptMembers === "function") {
            return await this.manager.options.default.exemptMembers(member);
        }
        return false;
    }

    /**
     * Function to filter channels. If true is returned, the channel won't be tracked.
     * @returns {Promise<number>}
     */
    async exemptChannels(channel) {
        if (typeof this.exemptChannelsFunction === "function") {
            try {
                const result = await this.exemptChannelsFunction(channel);
                return result;
            } catch (err) {
                console.error(`Guild Id: ${this.guildId}\nChannel Id: ${channel.id}\n${serialize(this.exemptChannelsFunction)}\n${err}`);
                return false;
            }
        }
        if (typeof this.manager.options.default.exemptChannels === "function") {
            return await this.manager.options.default.exemptChannels(channel);
        }
        return false;
    }

    /**
     * Function for xpAmountToAdd. If not provided, the default value is used (Math.floor(Math.random() * 10) + 1).
     * @returns {Promise<number>}
     */
    async xpAmountToAdd() {
        if (typeof this.xpAmountToAddFunction === "function") {
            try {
                const result = await this.xpAmountToAddFunction();
                if (typeof result === "number") return result;
                else return Math.floor(Math.random() * 10) + 1;
            } catch (err) {
                console.error(`xpAmountToAdd Config Error\n${serialize(this.xpAmountToAddFunction)}\n${err}`);
                return Math.floor(Math.random() * 10) + 1;
            }
        }
        if (typeof this.manager.options.default.xpAmountToAdd === "function") {
            const result = await this.manager.options.default.xpAmountToAdd();
            if (typeof result === "number") return result;
            else return Math.floor(Math.random() * 10) + 1;
        }
        return Math.floor(Math.random() * 10) + 1;
    }

    /**
     * Function for voiceTimeToAdd. If not provided, the default value is used (1000).
     * @returns {Promise<number>}
     */
    async voiceTimeToAdd() {
        if (typeof this.voiceTimeToAddFunction === "function") {
            try {
                const result = await this.voiceTimeToAddFunction();
                if (typeof result === "number") return result;
                else return 1000;
            } catch (err) {
                console.error(`voiceTimeToAdd Config Error\n${serialize(this.voiceTimeToAddFunction)}\n${err}`);
                return 1000;
            }
        }
        if (typeof this.manager.options.default.voiceTimeToAdd === "function") {
            const result = await this.manager.options.default.voiceTimeToAdd();
            if (typeof result === "number") return result;
            else return 1000;
        }
        return 1000;
    }

    /**
     * Function for levelMultiplier. If not provided, the default value is used (0.1).
     * @returns {Promise<number>}
     */
    async levelMultiplier() {
        if (typeof this.levelMultiplierFunction === "function") {
            try {
                const result = await this.levelMultiplierFunction();
                if (typeof result === "number") return result;
                else return 0.1;
            } catch (err) {
                console.error(`levelMultiplier Config Error\n${serialize(this.levelMultiplierFunction)}\n${err}`);
                return 0.1;
            }
        }
        if (typeof this.manager.options.default.levelMultiplier === "function") {
            const result = await this.manager.options.default.levelMultiplier();
            if (typeof result === "number") return result;
            else return 0.1;
        }
        return 0.1;
    }

    /**
     * @param {Member} member The member to check
     * @returns {Promise<boolean>}
     */
    async checkMember(member) {
        const exemptMember = await this.exemptMembers(member);
        if (exemptMember) return false;
        const hasPermission = this.exemptPermissions.some((permission) => member.permissions.has(permission));
        if (hasPermission) return false;
        if (!this.trackBots && member.user.bot) return false;
        if (!this.trackMute && (member.voice.selfMute || member.voice.serverMute)) return false;
        if (!this.trackDeaf && (member.voice.selfDeaf || member.voice.serverDeaf)) return false;
        if (this.minXpToParticipate && member.data.data.levelingData.xp < this.minXpToParticipate) return false;
        if (this.minLevelToParticipate > 0 && member.data.data.levelingData.level < this.minLevelToParticipate) return false;
        if (this.maxXpToParticipate > 0 && member.data.data.levelingData.xp > this.maxXpToParticipate) return false;
        if (this.maxLevelToParticipate > 0 && member.data.data.levelingData.level > this.maxLevelToParticipate) return false;
        return true;
    }

    /**
     * @param {VoiceChannel} channel The channel to check
     * @returns {Promise<boolean>}
     */
    async checkChannel(channel) {
        const exemptChannel = await this.exemptChannels(channel);
        if (exemptChannel) return false;
        if (!(this.trackAllChannels && lodash._.includes(this.channelIds, channel.id))) return false;
        if (this.minUserCountToParticipate > 0 && channel.members.size < this.minUserCountToParticipate) return false;
        if (this.maxUserCountToParticipate > 0 && channel.members.size > this.maxUserCountToParticipate) return false;
        return true;
    }

    /**
     * Edits the config
     * @param {ConfigEditOptions} options The edit options
     * @returns {Promise<Config>}
     */
    edit(options = {}) {
        return new Promise(async (resolve, reject) => {
            if (typeof options.newTrackBots === "boolean") this.options.trackBots = options.newTrackBots;
            if (typeof options.newTrackAllChannels === "boolean") this.options.trackAllChannels = options.newTrackAllChannels;
            if (typeof options.newExemptChannels === "string" && options.newExemptChannels.includes("function anonymous")) this.options.exemptChannels = options.newExemptChannels;
            if (Array.isArray(options.newChannelIds)) this.options.channelIds = options.newChannelIds;
            if (Array.isArray(options.newExemptPermissions)) this.options.exemptPermissions = options.newExemptPermissions;
            if (typeof options.newExemptMembers === "string" && options.newExemptMembers.includes("function anonymous")) this.options.exemptMembers = options.newExemptMembers;
            if (typeof options.newTrackMute === "boolean") this.options.trackMute = options.newTrackMute;
            if (typeof options.newTrackDeaf === "boolean") this.options.trackDeaf = options.newTrackDeaf;
            if (Number.isInteger(options.newMinUserCountToParticipate)) this.options.minUserCountToParticipate = options.newMinUserCountToParticipate;
            if (Number.isInteger(options.newMaxUserCountToParticipate)) this.options.maxUserCountToParticipate = options.newMaxUserCountToParticipate;
            if (Number.isInteger(options.newMinXpToParticipate)) this.options.minXpToParticipate = options.newMinXpToParticipate;
            if (Number.isInteger(options.newMinLevelToParticipate)) this.options.minLevelToParticipate = options.newMinLevelToParticipate;
            if (Number.isInteger(options.newMaxXpToParticipate)) this.options.maxXpToParticipate = options.newMaxXpToParticipate;
            if (Number.isInteger(options.newMaxLevelToParticipate)) this.options.maxLevelToParticipate = options.newMaxLevelToParticipate;
            if (typeof options.newXpAmountToAdd === "string" && options.newXpAmountToAdd.includes("function anonymous")) this.options.xpAmountToAdd = options.newXpAmountToAdd;
            if (typeof options.newVoiceTimeToAdd === "string" && options.newVoiceTimeToAdd.includes("function anonymous")) this.options.voiceTimeToAdd = options.newVoiceTimeToAdd;
            if (typeof options.newVoiceTimeTrackingEnabled === "boolean") this.options.voiceTimeTrackingEnabled = options.newVoiceTimeTrackingEnabled;
            if (typeof options.newLevelingTrackingEnabled === "boolean") this.options.levelingTrackingEnabled = options.newLevelingTrackingEnabled;
            if (typeof options.newLevelMultiplier === "string" && options.newLevelMultiplier.includes("function anonymous")) this.options.levelMultiplier = options.newLevelMultiplier;
            await this.manager.editConfig(this.guildId, this.data);
            resolve(this);
        });
    }
}
module.exports = Config;
