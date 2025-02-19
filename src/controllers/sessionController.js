const Joi = require("joi");
const {
  createSession,
  getSessionStatus,
  deleteSession,
} = require("../services/whatsappService");
const whatsappService = require("../services/whatsappService");
const { sendResponse } = require("../utils/response");
const httpStatusCode = require("../constants/httpStatusCode");
const logger = require("../utils/logger");

module.exports = {
  async status(req, res) {
    const schema = Joi.object({
      sessionId: Joi.string().required(),
    });

    const { error } = schema.validate(req.params);

    if (error) {
      return sendResponse(
        res,
        httpStatusCode.BAD_REQUEST,
        error.details[0].message
      );
    }

    const { sessionId } = req.params;
    try {
      const session = await getSessionStatus(sessionId);
      logger.info({
        msg: "Session status retrieved",
        sessionId,
        status: session.status,
      });

      return sendResponse(
        res,
        httpStatusCode.OK,
        "Session status retrieved successfully",
        { session }
      );
    } catch (error) {
      logger.error({
        msg: "Error getting session status",
        sessionId,
        error: error.message,
        stack: error.stack,
      });
      return sendResponse(
        res,
        httpStatusCode.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  },

  async create(req, res) {
    const schema = Joi.object({
      sessionId: Joi.required(),
    });
    const { error } = schema.validate(req.params);

    if (error) {
      return ResponseUtil.badRequest({
        res,
        message: error.details[0].message,
      });
    }
    const { sessionId } = req.params;

    try {
      logger.info({
        msg: "Creating new session",
        sessionId,
      });
      await createSession(sessionId, false, res);
    } catch (error) {
      logger.error({
        msg: "Error creating session",
        sessionId,
        error: error.message,
        stack: error.stack,
      });
      return ResponseUtil.internalError({ res, error: error });
    }
  },

  async logout(req, res) {
    const schema = Joi.object({
      sessionId: Joi.required(),
    });
    const { error } = schema.validate(req.params);

    if (error) {
      return ResponseUtil.badRequest({
        res,
        message: error.details[0].message,
      });
    }
    const { sessionId } = req.params;
    try {
      logger.info({
        msg: "Logging out session",
        sessionId,
      });
      await deleteSession(sessionId, false);

      return ResponseUtil.ok({ res, data: null, message: "Session deleted" });
    } catch (error) {
      logger.error({
        msg: "Error logging out session",
        sessionId,
        error: error.message,
        stack: error.stack,
      });
      return ResponseUtil.internalError({ res, error: error });
    }
  },

  async getGroups(req, res) {
    const { sessionId } = req.params;

    try {
      const client = whatsappService.getSession(sessionId);
      if (!client) {
        return ResponseUtil.notFound({
          res,
          message: "Session not found",
        });
      }

      // Ambil daftar grup
      const groups = whatsappService.getChatList(sessionId, true);

      // Format response
      const formattedGroups = groups.map((group) => ({
        id: group.id,
        name: group.name,
        participant_count: group.participant_count || 0,
        creation_time: group.creation_time,
      }));

      return ResponseUtil.ok({
        res,
        message: "Groups retrieved successfully",
        data: {
          groups: formattedGroups,
        },
      });
    } catch (error) {
      console.error(`[${sessionId}] Error getting groups:`, error);
      return ResponseUtil.internalError({
        res,
        message: "Failed to get groups",
        error: error.message,
      });
    }
  },
};
