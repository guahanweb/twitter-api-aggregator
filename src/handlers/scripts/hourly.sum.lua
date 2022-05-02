local summary = KEYS[1]
local tweeted = KEYS[2]
local retweeted = KEYS[3]
local quoted = KEYS[4]
local replied = KEYS[5]

local limit = ARGV[1]

redis.call(
    "ZUNIONSTORE",
    summary,
    4, tweeted, retweeted, quoted, replied,
    "WEIGHTS", 10, 1, 3, 4
)

local authors = redis.call(
    "ZRANGE",
    summary,
    "+inf", "-inf", "REV", "BYSCORE",
    "LIMIT", 0, tonumber(limit),
    "WITHSCORES"
)

return authors
