local prefix = ARGV[1]
local tweeted_weight = tonumber(ARGV[2])
local retweeted_weight = tonumber(ARGV[3])
local quoted_weight = tonumber(ARGV[4])
local replied_weight = tonumber(ARGV[5])

-- concatenate the contents of two tables
local function TableConcat(t1, t2) 
    for i, v in ipairs(t2) do
        t1[#t1+1] = v
    end
    return t1
end

local function objectify(list)
    local i = 0
    local len = #list
    local o = {}
    while i < len do
        local key = list[i+1]
        local value = list[i+2]
        o[key] = value
        i = i + 2
    end
    return o
end

local function loadAuthors(scores)
    local i = 0
    local len = #scores
    local authors = {}
    while i < len do
        local id = scores[i+1]
        local score = scores[i+2]
        local author = objectify(redis.call('HGETALL', 'user:'..tostring(id)))
        author.score = score
        table.insert(authors, author)
        i = i + 2
    end
    return authors
end

-- here are the categories
local authors = {keys = {}, weights = {}}
local tags = {keys = {}, weights = {}}
local base_keys = redis.call("KEYS", prefix.."*")

-- sort the indexes along with weighting
for i, key in ipairs(base_keys) do
    if string.find(key, ':authors') then
        if string.find(key, ':tweeted') then
            table.insert(authors.keys, key)
            table.insert(authors.weights, tweeted_weight)
        elseif string.find(key, ':retweeted') then
            table.insert(authors.keys, key)
            table.insert(authors.weights, retweeted_weight)
        elseif string.find(key, ':quoted') then
            table.insert(authors.keys, key)
            table.insert(authors.weights, quoted_weight)
        elseif string.find(key, ':replied_to') then
            table.insert(authors.keys, key)
            table.insert(authors.weights, replied_weight)
        end
    elseif string.find(key, ':tags') then
        if string.find(key, ':tweeted') then
            table.insert(tags.keys, key)
            table.insert(tags.weights, tweeted_weight)
        elseif string.find(key, ':retweeted') then
            table.insert(tags.keys, key)
            table.insert(tags.weights, retweeted_weight)
        elseif string.find(key, ':quoted') then
            table.insert(tags.keys, key)
            table.insert(tags.weights, quoted_weight)
        elseif string.find(key, ':replied_to') then
            table.insert(tags.keys, key)
            table.insert(tags.weights, replied_weight)
        end
    end
end

-- run the UNION on the day asked for
local authorsList = {}
if #authors.keys > 0 then
    local authorSummaryKey = prefix..':authors'
    local unionargs = { authorSummaryKey, #authors.keys }
    unionargs = TableConcat(unionargs, authors.keys)
    table.insert(unionargs, 'WEIGHTS')
    unionargs = TableConcat(unionargs, authors.weights)
    redis.call('ZUNIONSTORE', unpack(unionargs))

    -- retrieve the author results
    local authors_results = redis.call('ZRANGE',
        authorSummaryKey,
        "+inf", "-inf", "REV", "BYSCORE",
        "LIMIT", 0, 25,
        "WITHSCORES"
    )
    authorsList = loadAuthors(authors_results);
end


-- run the UNION for tags
local tags_results = {}
if #tags.keys > 0 then
    local tagSummaryKey = prefix..':tags'
    local unionargs = { tagSummaryKey, #tags.keys }
    unionargs = TableConcat(unionargs, tags.keys)
    table.insert(unionargs, 'WEIGHTS')
    unionargs = TableConcat(unionargs, tags.weights)
    redis.call('ZUNIONSTORE', unpack(unionargs))

    -- retrieve the tag results
    tags_results = redis.call("ZRANGE",
        tagSummaryKey,
        "+inf", "-inf", "REV", "BYSCORE",
        "LIMIT", 0, 25,
        "WITHSCORES"
    )
end

local results = {
    keyCount = #base_keys,
    authors = authorsList,
    tags = tags_results
}

return cjson.encode(results)
