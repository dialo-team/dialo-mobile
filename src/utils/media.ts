import { ChatMediaItem } from "@/src/api/chat/types";

export const filterImages = (list: ChatMediaItem[]) =>
    list.filter((m) => m.type === "IMAGE");

export const filterVideos = (list: ChatMediaItem[]) =>
    list.filter((m) => m.type === "VIDEO");

export const filterFiles = (list: ChatMediaItem[]) =>
    list.filter((m) => m.type === "FILE");
