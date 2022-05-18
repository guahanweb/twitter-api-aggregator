local prefix = ARGV[1]
local filter = ARGV[2]

-- retreive all the keys for prefixed record
local result = {}
local base_keys = redis.call("KEYS", prefix.."*")
for i, key in ipairs(base_keys) do
    -- sort all our keys first
    if string.find(key, filter) then
        table.insert(result, key)
    end
end
return result;
