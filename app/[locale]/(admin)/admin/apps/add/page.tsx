import { getDb } from "@/drizzle/db";
import { apps } from "@/drizzle/schema";
import { Apps } from "@/types/apps";
import Empty from "@/components/blocks/empty";
import FormSlot from "@/components/dashboard/slots/form";
import type { Form as FormSlotType } from "@/types/slots/form";
import { getUserInfo } from "@/services/user";
import { newStorage } from "@/lib/storage";
import { getUuid } from "@/lib/hash";

export default async function () {
  const user = await getUserInfo();
  if (!user || !user.uuid) {
    return <Empty message="no auth" />;
  }

  const form: FormSlotType = {
    title: "Add App",
    crumb: {
      items: [
        {
          title: "Apps",
          url: "/admin/apps",
        },
        {
          title: "Add App",
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
        type: "markdown_editor",
        placeholder: "App Description",
        validation: {
          required: true,
        },
        attributes: {
          rows: 10,
          uploadImage: true,
        },
      },
      {
        name: "category",
        title: "Category",
        type: "select",
        options: [
          { title: "默认", value: "1" },
          { title: "装机", value: "2" },
          { title: "网络软件", value: "3" },
          { title: "媒体", value: "4" },
          { title: "编程软件", value: "5" },
          { title: "图像", value: "6" },
          { title: "系统软件", value: "7" },
          { title: "应用软件", value: "8" },
          { title: "手机软件", value: "9" },
          { title: "资讯", value: "13" },
          { title: "游戏", value: "31" },
          { title: "AI", value: "52" }
        ],
        value: "1",
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
    ],
    submit: {
      button: {
        title: "Submit",
      },
      handler: async (data: FormData) => {
        "use server";

        const title = data.get("title") as string;
        const content = data.get("content") as string;
        const category = Number(data.get("category"));
        const download_url = data.get("download_url") as string;

        if (!title?.trim() || !content?.trim() || !download_url?.trim()) {
          throw new Error("Please fill in all required fields");
        }

        try {
          const db = await getDb();
          await db.insert(apps).values({
            title,
            content,
            category,
            download_url,
            date: new Date(),
          });

          return {
            status: "success",
            message: "App added successfully",
            redirect_url: "/admin/apps",
          };
        } catch (err: unknown) {
          if (err instanceof Error) {
            throw new Error(err.message);
          }
          throw new Error("An unknown error occurred");
        }
      },
    },
  };

  return <FormSlot {...form} />;
}
