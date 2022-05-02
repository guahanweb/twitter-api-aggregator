local summary = KEYS[1]
local tweeted = KEYS[2]
local retweeted = KEYS[3]
local quoted = KEYS[4]
local replied = KEYS[5]

redis.call(
    "ZUNIONSTORE",
    summary,
    4, tweeted, retweeted, quoted, replied,
    "WEIGHTS", 6, 3, 1, 1
)

local result = redis.call(
    "ZRANGE",
    summary,
    "+inf", "-inf", "REV", "BYSCORE",
    "LIMIT", 0, 10,
    "WITHSCORES"
)

return result