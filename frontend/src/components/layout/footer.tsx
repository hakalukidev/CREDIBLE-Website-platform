import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t bg-background mt-16">
      <div className="container-wide py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div className="col-span-2 md:col-span-1">
          <p className="font-bold text-base">Credible</p>
          <p className="mt-2 text-muted-foreground">
            Find, review, and verify trusted businesses and professionals.
          </p>
        </div>
        <div>
          <p className="font-semibold mb-3">Product</p>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link href={{ pathname: '/search' }} className="hover:text-foreground">Browse</Link></li>
            <li><Link href={{ pathname: '/categories' }} className="hover:text-foreground">Categories</Link></li>
            <li><Link href={{ pathname: '/for-business' }} className="hover:text-foreground">For business</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold mb-3">Company</p>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link href={{ pathname: '/about' }} className="hover:text-foreground">About</Link></li>
            <li><Link href={{ pathname: '/blog' }} className="hover:text-foreground">Blog</Link></li>
            <li><Link href={{ pathname: '/contact' }} className="hover:text-foreground">Contact</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold mb-3">Legal</p>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link href={{ pathname: '/terms' }} className="hover:text-foreground">Terms</Link></li>
            <li><Link href={{ pathname: '/privacy' }} className="hover:text-foreground">Privacy</Link></li>
            <li><Link href={{ pathname: '/guidelines' }} className="hover:text-foreground">Community Guidelines</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Credible. All rights reserved. || developed by: Hakaluki.dev
      </div>
    </footer>
  );
}