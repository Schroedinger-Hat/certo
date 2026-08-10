# List Achievements

List all available achievement / badge definitions in a Certo instance.

## API

```
GET /api/achievements?status=published
```

No authentication required for published achievements.

## Response

```json
{
  "data": [
    {
      "id": 1,
      "achievementType": "Web Development Fundamentals",
      "description": "Demonstrates proficiency in modern web development.",
      "criteria": "Complete all 8 modules and pass the final assessment."
    }
  ]
}
```

## MCP Tool

`list_achievements` — available via `@certo/mcp`

```json
{}
```

## Notes

- Returns only published achievements by default
- Use `achievementId` values when calling `issue_credential`
