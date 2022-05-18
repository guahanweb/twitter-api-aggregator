local summary = ARGV[1]
local indexes = cjson.decode(ARGV[2])

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

-- calculate the available summary indexes
local author_keys = {}
local tag_keys = {}

for _, v in ipairs(indexes) do
    local akey = v..':authors'
    local tkey = v..':tags'

    if redis.call('EXISTS', akey) then
        table.insert(author_keys, akey)
    end

    if redis.call('EXISTS', tkey) then
        table.insert(tag_keys, tkey)
    end
end

local authorSummaryIndex = summary..':authors'
local tagSummaryIndex = summary..':tags'

local authorList = {}
if #author_keys > 0 then
    local args = { authorSummaryIndex, #author_keys }
    args = TableConcat(args, author_keys)
    redis.call('ZUNIONSTORE', unpack(args))

    -- retrieve top 25 to return
    local author_results = redis.call("ZRANGE",
        authorSummaryIndex,
        "+inf", "-inf", "REV", "BYSCORE",
        "LIMIT", 0, 25,
        "WITHSCORES"
    )
    authorList = loadAuthors(author_results);
end


local tag_results = {}
if #tag_keys > 0 then
    local args = { tagSummaryIndex, #tag_keys }
    args = TableConcat(args, tag_keys)
    redis.call('ZUNIONSTORE', unpack(args))

    -- retrieve top 25 to return
    tag_results = redis.call("ZRANGE",
        tagSummaryIndex,
        "+inf", "-inf", "REV", "BYSCORE",
        "LIMIT", 0, 25,
        "WITHSCORES"
    )
end

local results = {
    authors = authorList,
    tags = tag_results
}

return cjson.encode(results)
