# opencli-plugin-vk

A plugin for [OpenCLI](https://github.com/jackwener/opencli) to interact with VK (VKontakte) using your live browser session.

Bypasses VK's dynamic CSRF tokens and authorization by reusing your active Chrome session.

## Installation

```bash
opencli plugin install github:flobo3/opencli-plugin-vk
```

## Commands

### `wall`
Fetch posts from a user or community wall.

```bash
opencli vk wall durov --limit 5
opencli vk wall -34767424 --limit 10
```

### `feed`
Fetch your personal news feed.

```bash
opencli vk feed --limit 5
```

### `search`
Search for posts across VK.

```bash
opencli vk search "open source" --limit 5
```

*(More commands like `messages` coming soon!)*

## Requirements
- Node.js >= 20
- OpenCLI installed (`npm i -g @jackwener/opencli`)
- Chrome running and logged into `vk.com`

## License
MIT