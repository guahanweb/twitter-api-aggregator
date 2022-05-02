export interface Includes {
    users: ExpandedUser[];
}

export interface ExpandedUser {
    id: string;
    name: string;
    username: string;
    public_metrics: {
        followers_count: number;
        following_count: number;
        tweet_count: number;
        listed_count: number;
    }
}

export interface EntityTag {
    start: number;
    end: number;
    tag: string;
}

export interface EntityMention {
    start: number;
    end: number;
    username: string;
    id: string;
}

export interface EntityUrl {
    start: number;
    end: number;
    url: string;
    expanded_url: string;
    display_url: string;
    images: any[],
    status: number;
    title: string;
    description: string;
    unwound_url: string;
}

export interface TweetEntitities {
    hashtags?: EntityTag[];
    mentions?: EntityMention[];
    urls?: EntityUrl[];
}
