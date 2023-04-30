import { createCmd } from "./__command";
import { PgCommon } from "../../common";
import { EventName } from "../../../../constants";

export const deploy = createCmd({
  name: "deploy",
  description: "Deploy your program",
  process: async () => {
    return await PgCommon.sendAndReceiveCustomEvent<
      undefined,
      number | undefined
    >(EventName.COMMAND_DEPLOY);
  },
});