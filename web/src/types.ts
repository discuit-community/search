export type SqlBoolean = 0 | 1;
export interface Post {
	publicId: string;
	createdAt: string;
	title: string;
	body: string;
	communityName: string;
	username: string;
	type: "image" | "link" | "text";
	hotness: number;
	upvotes: number;
	downvotes: number;
	isPinned: SqlBoolean;
	isDeleted: SqlBoolean;
}
