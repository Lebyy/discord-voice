const merge = require("deepmerge");
const Discord = require("discord.js");
const serialize = require("serialize-javascript");
const { EventEmitter } = require("events");
const { UserOptions, UserVoiceTimeOptions, UserLevelingOptions, UserData, UserEditOptions, channelAndMemberOptions } = require("./Constants.js");
const VoiceManager = require("./Manager.js");

/**
 * Represents a User
 */
class User extends EventEmitter {
    /**
     * @param {VoiceManager} manager The Voice Manager
     * @param {UserData} options The user options
     */
    constructor(manager, options) {
        super();
        /**
         * The Voice Manager
         * @type {VoiceManager}
         */
        this.manager = manager;
        /**
         * The Discord Client
         * @type {Client}
         */
        this.client = manager.client;
        /**
         * The id of the user
         * @type {Snowflake}
         */
        this.userId = options.userId;
        /**
         * The guild id of the user
         * @type {Snowflake}
         */
        this.guildId = options.guildId;
        /**
         * The user voice time options
         * @type {UserVoiceTimeOptions}
         */
        this.voiceTime = options.data.voiceTime;
        /**
         * The user leveling options
         * @type {UserLevelingOptions}
         */
        this.levelingData = options.data.levelingData;
        /**
         * The user options
         * @type {UserOptions}
         */
        this.options = options.data;
    }

    /**
     * The guild of the user
     * @type {Guild}
     * @readonly
     */
    get guild() {
        return this.client.guilds.cache.get(this.guildId);
    }

    /**
     * The user
     * @type {DiscordUser}
     * @readonly
     */
    get user() {
        return this.client.users.cache.get(this.userId);
    }

    /**
     * Returns the user's voice channel and the member itself and creates a new user if a member is present in the voice channel and dosen't exist in the databse
     * @type {channelAndMemberOptions}
     * @readonly
     */
    get channelAndMember() {
        return this.guild.channels.cache
            .filter((c) => c.type === "voice" || c.type === "GUILD_VOICE" || c.type === "GUILD_STAGE_VOICE")
            .map((voicechannel) => {
                return voicechannel.members
                    .map((x) => {
                        if (!this.manager.users.find((u) => u.userId === x.id)) {
                            this.manager._checkUser(x);
                        }
                        if (x.id === this.userId) return { channel: voicechannel, member: x };
                    })
                    .find((val) => val);
            })
            .find((val) => val);
    }

    /**
     * The user's voice channel if present
     * @type {VoiceChannel}
     * @readonly
     */
    get channel() {
        let returnedJSONObject = this.channelAndMember;
        if (returnedJSONObject) return returnedJSONObject.channel;
        else return null;
    }

    /**
     * The guild member data of the user
     * @type {Member}
     * @readonly
     */
    get member() {
        let returnedJSONObject = this.channelAndMember;
        if (returnedJSONObject) return returnedJSONObject.member;
        else return null;
    }

    /**
     * The raw user data object for this user
     * @type {UserData}
     * @readonly
     */
    get data() {
        const baseData = {
            userId: this.userId,
            guildId: this.guildId,
            data: {
                voiceTime: this.voiceTime,
                levelingData: this.levelingData
            }
        };
        return baseData;
    }

    /**
     * Edits the user
     * @param {UserEditOptions} options The edit options
     * @returns {Promise<User>}
     */
    edit(options = {}) {
        return new Promise(async (resolve, reject) => {
            if (typeof options.newVoiceTime === "object" && Array.isArray(options.newVoiceTime.channels) && Number.isInteger(options.newVoiceTime.total)) this.voiceTime = options.newVoiceTime;
            if (typeof options.newLevelingData === "object" && Number.isInteger(options.newLevelingData.xp) && Number.isInteger(options.newLevelingData.level)) this.levelingData = options.newLevelingData;
            await this.manager.editUser(this.userId, this.guildId, this.data);
            resolve(this);
        });
    }
}
module.exports = User;
