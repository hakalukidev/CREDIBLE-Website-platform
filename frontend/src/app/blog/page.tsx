import { BlogIndex } from '@/features/blog/blog-index';
import { POSTS } from '@/features/blog/posts';
import { JsonLd } from '@/components/static/json-ld';
import { pageMetadata } from '@/lib/seo/metadata';
import { blogSchema, breadcrumbSchema } from '@/lib/seo/structured-data';

export const metadata = pageMetadata({
  title: 'Blog',
  description:
    'Insights, guides, and updates from the Credible team on trust, verification, and reviews.',
  path: '/blog',
});

export const revalidate = 86_400;

export default function BlogPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Blog', url: '/blog' }]),
          blogSchema(POSTS),
        ]}
      />
      <BlogIndex posts={POSTS} />
    </>
  );
}
