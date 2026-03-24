import { cli, Strategy } from '@jackwener/opencli/registry';

// Helper function to extract token
const getTokenScript = `
  let token = '';
  for (let i = 0; i < localStorage.length; i++) {
    try {
      const key = localStorage.key(i);
      if (!key) continue;
      const val = localStorage.getItem(key);
      const match = val ? val.match(/vk1\\.a\\.[a-zA-Z0-9_\\-]+/) : null;
      if (match) {
        token = match[0];
        break;
      }
    } catch(e) {}
  }
  if (!token) {
    const html = document.documentElement.innerHTML;
    const tokenMatch = html.match(/vk1\\.a\\.[a-zA-Z0-9_\\-]+/);
    if (tokenMatch) {
      token = tokenMatch[0];
    }
  }
  if (!token) {
    throw new Error('Could not find VK access token (vk1.a...) on the page or in localStorage');
  }
`;

// Helper function to format posts
const formatPosts = (items: any[], profiles: any[], groups: any[]) => {
  const authors = [...profiles, ...groups];
  
  return items
    .filter((post: any) => post.date && (post.post_id || post.id)) // Filter out empty/ad posts
    .map((post: any) => {
      const authorId = post.source_id || post.from_id;
      const authorObj = authors.find((a: any) => a.id === Math.abs(authorId));
      let authorName = String(authorId);
      if (authorObj) {
        authorName = authorObj.name || (authorObj.first_name + ' ' + authorObj.last_name);
      }
      
      const date = new Date(post.date * 1000).toLocaleDateString('ru-RU', { 
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
      });
      
      let text = post.text || '';
      // Clean up VK alias tags like [#alias|vk.ru/club123|https://vk.ru/club123]
      text = text.replace(/\[#alias\|[^|]+\|([^\]]+)\]/g, '$1');
      text = text.replace(/\n/g, ' ').trim();
      if (text.length > 80) text = text.substring(0, 77) + '...';
      if (!text && post.attachments) text = '[Вложения: ' + post.attachments.length + ']';
      
      return {
        id: post.post_id || post.id,
        author: authorName,
        date: date,
        likes: post.likes ? post.likes.count : 0,
        views: post.views ? post.views.count : 0,
        text: text
      };
    });
};

// Command: wall
cli({
  site: 'vk',
  name: 'wall',
  description: 'Fetch posts from a VK user or group wall using internal API',
  strategy: Strategy.COOKIE,
  browser: true,
  args: [
    {
      name: 'id',
      type: 'string',
      required: true,
      positional: true
    },
    {
      name: 'limit',
      type: 'int',
      default: 10
    }
  ],
  columns: ['id', 'author', 'date', 'likes', 'views', 'text'],
  func: async (page, kwargs) => {
    await page.goto(`https://vk.com/${kwargs.id}`);
    await new Promise(r => setTimeout(r, 2000));

    const data = await page.evaluate(`
      (async () => {
        ${getTokenScript}
        
        const formData = new URLSearchParams();
        formData.append('domain', '${kwargs.id}');
        formData.append('count', '${kwargs.limit}');
        formData.append('extended', '1');
        formData.append('access_token', token);
        formData.append('v', '5.274');
        
        const res = await fetch('https://api.vk.com/method/wall.get?client_id=6287487', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData.toString()
        });
        
        return await res.json();
      })()
    `);

    if (data.error) {
      throw new Error('VK API Error: ' + data.error.error_msg);
    }
    
    return formatPosts(data.response.items, data.response.profiles || [], data.response.groups || []);
  }
});

// Command: feed
cli({
  site: 'vk',
  name: 'feed',
  description: 'Fetch your personal news feed',
  strategy: Strategy.COOKIE,
  browser: true,
  args: [
    {
      name: 'limit',
      type: 'int',
      default: 10
    }
  ],
  columns: ['id', 'author', 'date', 'likes', 'views', 'text'],
  func: async (page, kwargs) => {
    await page.goto('https://vk.com/feed');
    await new Promise(r => setTimeout(r, 2000));

    const data = await page.evaluate(`
      (async () => {
        ${getTokenScript}
        
        const formData = new URLSearchParams();
        formData.append('filters', 'post');
        formData.append('count', '${kwargs.limit}');
        formData.append('extended', '1');
        formData.append('access_token', token);
        formData.append('v', '5.274');
        
        const res = await fetch('https://api.vk.com/method/newsfeed.get?client_id=6287487', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData.toString()
        });
        
        return await res.json();
      })()
    `);

    if (data.error) {
      throw new Error('VK API Error: ' + data.error.error_msg);
    }
    
    return formatPosts(data.response.items, data.response.profiles || [], data.response.groups || []);
  }
});

// Command: search
cli({
  site: 'vk',
  name: 'search',
  description: 'Search for posts across VK',
  strategy: Strategy.COOKIE,
  browser: true,
  args: [
    {
      name: 'query',
      type: 'string',
      required: true,
      positional: true
    },
    {
      name: 'limit',
      type: 'int',
      default: 10
    }
  ],
  columns: ['id', 'author', 'date', 'likes', 'views', 'text'],
  func: async (page, kwargs) => {
    await page.goto(`https://vk.com/feed?obj=${encodeURIComponent(kwargs.query)}&q=${encodeURIComponent(kwargs.query)}&section=search`);
    await new Promise(r => setTimeout(r, 2000));

    const data = await page.evaluate(`
      (async () => {
        ${getTokenScript}
        
        const formData = new URLSearchParams();
        formData.append('q', '${kwargs.query}');
        formData.append('count', '${kwargs.limit}');
        formData.append('extended', '1');
        formData.append('access_token', token);
        formData.append('v', '5.274');
        
        const res = await fetch('https://api.vk.com/method/newsfeed.search?client_id=6287487', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData.toString()
        });
        
        return await res.json();
      })()
    `);

    if (data.error) {
      throw new Error('VK API Error: ' + data.error.error_msg);
    }
    
    return formatPosts(data.response.items, data.response.profiles || [], data.response.groups || []);
  }
});