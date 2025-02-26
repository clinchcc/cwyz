import {
  getApp,
  updateApp,
} from "@/models/apps";
import { localeNames, locales } from "@/i18n/locale";

import Empty from "@/components/blocks/empty";
import FormSlot from "@/components/dashboard/slots/form";
import type { Form as FormSlotType } from "@/types/slots/form";
import type { Apps } from "@/types/apps";
import { getIsoTimestr } from "@/lib/time";
import { getUserInfo } from "@/services/user";

export default async function ({ params }: { params: { appid: string } }) {
  const user = await getUserInfo();
  if (!user || !user.uuid) {
    return <Empty message="no auth" />;
  }

  const app = await getApp(Number(params.appid));
  if (!app) {
    return <Empty message="app not found" />;
  }

  const form: FormSlotType = {
    title: "Edit App",
    crumb: {
      items: [
        {
          title: "Apps",
          url: "/admin/apps",
        },
        {
          title: "Edit App",
          is_active: true,
        },
      ],
    },
    fields: [
      {
        name: "title",
        title: "Title",
        type: "text",
        placeholder: "App Title",
        validation: {
          required: true,
        },
      },
      {
        name: "content",
        title: "Content",
        type: "textarea",
        placeholder: "App Description",
        attributes: {
          rows: 5, // Set the number of rows to control the height of the textarea
        },
        validation: {
          required: true,
        },
      },
      {
        name: "category",
        title: "Category",
        type: "select",
        options: [
          { title: "1 - Uncategorized", value: "1" },
          { title: "2 - Essential Software", value: "2" },
          { title: "3 - Network Tools", value: "3" },
          { title: "4 - Media", value: "4" },
          { title: "5 - Programming", value: "5" },
          { title: "6 - Graphics", value: "6" },
          { title: "7 - System Tools", value: "7" },
          { title: "8 - Applications", value: "8" },
          { title: "9 - Mobile Apps", value: "9" },
          { title: "13 - News", value: "13" },
          { title: "31 - Games", value: "31" },
          { title: "52 - AI", value: "52" },
        ],
        value: String(app.category || 1),
        validation: {
          required: true,
        },
      },
      {
        name: "download_url",
        title: "Download URL",
        type: "url",
        placeholder: "App Download URL",
        validation: {
          required: true,
        },
      },
      {
        name: "locale",
        title: "Locale",
        type: "select",
        options: locales.map((locale: string) => ({
          title: localeNames[locale],
          value: locale,
        })),
        value: "zh",
        validation: {
          required: true,
        },
      },
    ],
    data: app,
    passby: {
      user,
      app,
    },
    submit: {
      button: {
        title: "Submit",
      },
      handler: async (data: FormData, passby: any) => {
        "use server";

        const { user, app } = passby;
        if (!user || !app || !app.appid) {
          throw new Error("invalid params");
        }

        const title = data.get("title") as string;
        const content = data.get("content") as string;
        const category = Number.parseInt(data.get("category") as string, 10);
        const download_url = data.get("download_url") as string;
        const locale = data.get("locale") as string;

        if (!title || !content || !download_url || !locale || Number.isNaN(category)) {
          throw new Error("invalid form data");
        }

        const updatedApp: Partial<Apps> = {
          title,
          content,
          category,
          download_url,
          date: new Date(),
        };

        try {
          await updateApp(app.appid, updatedApp, locale);

          return {
            status: "success",
            message: "App updated",
            redirect_url: "/admin/apps",
          };
        } catch (err: any) {
          throw new Error(err.message);
        }
      },
    },
  };

  return <FormSlot {...form} />;
}
