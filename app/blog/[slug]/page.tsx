import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { blogPosts } from "../blog-data";
export function generateStaticParams(){return blogPosts.map(post=>({slug:post.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const post=blogPosts.find(p=>p.slug===slug);return {title:post?`${post.title} | Móntate en Mi Viaje`:"Blog",description:post?.excerpt};}
export default async function Article({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const post=blogPosts.find(p=>p.slug===slug);if(!post)notFound();return <main className="container section"><article className="travel-article"><Link href="/blog" className="travel-back">← Volver al blog</Link><header><span>{post.tag}</span><h1>{post.title}</h1><p>{post.excerpt}</p></header><img className="travel-article-cover" src={post.image} alt="" /><div className="travel-article-text">{post.sections.map(([title,text])=><section key={title}><h2>{title}</h2><p>{text}</p></section>)}</div><div className="travel-blog-cta"><h2>¿Listo para montar tu viaje?</h2><p>Diseñemos una experiencia con tu grupo.</p><Link className="button-dark" href="/organizar-viaje">Planificar mi viaje ↗</Link></div></article></main>}
