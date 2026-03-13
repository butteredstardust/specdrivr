# Senior Review: Add .mcp.json to .gitignore

The change is straightforward and addresses a potential security risk. Keeping `.mcp.json` out of version control is essential as it typically contains local environment-specific paths and potentially sensitive authentication tokens (like the GitHub personal access token).

## Improvements & Considerations

- The placement under "Claude system files" is appropriate as `.mcp.json` is primarily used by Claude Desktop or similar MCP-enabled clients.
- This ensures that developers can have their own local MCP configurations without conflicting with others or accidentally leaking secrets.

Overall, this is a necessary and well-scoped change.
