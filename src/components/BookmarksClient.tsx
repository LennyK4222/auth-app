"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MessageSquare, Clock, Tag, Bookmark, Trash2, User, Crown, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCsrfContext } from '@/contexts/CsrfContext';
import { useToast } from '@/components/ui/toast';
import Image from 'next/image';
import Link from 'next/link';
import LikeButton from './LikeButton';

interface BookmarkedPost {
  _id: string;
  title: string;
  body: string;
  authorId: {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  score: number;
  votes: Record<string, number>;
  commentsCount: number;
  createdAt: string;
  category: string;
  bookmarkedByMe?: boolean;
}

interface BookmarksClientProps {
  initialBookmarks: BookmarkedPost[];
}

function getCategoryDisplayName(categorySlug?: string) {
  if (!categorySlug) return 'General';
  
  const categoryNames: Record<string, string> = {
    'tehnologie': 'Tehnologie',
    'fotografie': 'Fotografie',
    'gaming': 'Gaming',
    'muzica': 'Muzică',
    'educatie': 'Educație',
    'business': 'Business',
    'general': 'General',
  };
  
  return categoryNames[categorySlug] || categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1);
}

export default function BookmarksClient({ initialBookmarks }: BookmarksClientProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkedPost[]>(initialBookmarks);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { csrfToken } = useCsrfContext();
  const { toast, ToastContainer } = useToast();

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'acum câteva secunde';
    if (diffInSeconds < 3600) return `acum ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `acum ${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 2592000) return `acum ${Math.floor(diffInSeconds / 86400)} zile`;
    return date.toLocaleDateString('ro-RO');
  };


  const handleDelete = async (postId: string) => {
    if (!user) return;

    if (!confirm('Ești sigur că vrei să ștergi această postare?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      });

      if (response.ok) {
        setBookmarks(prev => prev.filter(post => post._id !== postId));
        toast({
          title: "Succes",
          description: "Postarea a fost ștearsă",
        });
      } else {
        toast({
          title: "Eroare",
          description: "Nu s-a putut șterge postarea",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la ștergerea postării",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (postId: string) => {
    console.log('🔖 handleBookmark called with postId:', postId);
    
    if (!user) {
      toast({
        title: "Eroare",
        description: "Trebuie să fii autentificat pentru a salva postări",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ postId }),
      });

      if (response.ok) {
        const { bookmarked } = await response.json();
        
        if (!bookmarked) {
          // Remove from bookmarks list
          setBookmarks(prev => prev.filter(post => post._id !== postId));
          toast({
            title: "Succes",
            description: "Postarea a fost eliminată din salvate",
          });
        }
      } else {
        toast({
          title: "Eroare",
          description: "Nu s-a putut procesa salvarea",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error bookmarking post:', error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la procesarea cererii",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'moderator':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-400" />;
    }
  };



  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-12">
        <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          Nu ai postări salvate
        </h3>
        <p className="text-gray-400">
          Salvează postări interesante pentru a le găsi aici mai târziu
        </p>
        <Link href="/">
          <Button className="mt-4">
            Explorează postări
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className="space-y-3" suppressHydrationWarning>
        <AnimatePresence mode="popLayout">
          {bookmarks.map((post, index) => (
            <motion.div
              key={post._id}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ delay: index * 0.08 }}
              className="neon-card hover:scale-[1.01] transition-all duration-200 cursor-pointer"
              onClick={(e) => {
                const target = e.target as HTMLElement | null;
                console.log('🎯 Card click - target:', target?.tagName, target?.className);
                
                // Check if we clicked on a button or inside a button
                const clickedButton = target?.closest('button');
                const clickedNoNav = target?.closest('[data-no-nav]');
                const clickedLink = target?.closest('a');
                const clickedSvg = target?.closest('svg');
                
                console.log('🎯 Clicked button:', clickedButton);
                console.log('🎯 Clicked no-nav:', clickedNoNav);
                console.log('🎯 Clicked link:', clickedLink);
                console.log('🎯 Clicked svg:', clickedSvg);
                
                // Prevent navigation if we clicked on interactive elements
                if (clickedButton || clickedNoNav || clickedLink || clickedSvg) {
                  console.log('🚫 Navigation prevented - clicked on interactive element');
                  return;
                }
                
                console.log('✅ Navigating to thread:', post._id);
                window.location.href = `/thread/${post._id}`;
              }}
            >
              <div className="p-6 flex gap-5">
                <div data-no-nav onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
                  <LikeButton
                    postId={post._id}
                    initialLikes={post.score}
                    initialLiked={Boolean(user && post.votes && post.votes[user.id] === 1)}
                    onLike={(liked, likes) =>
                      setBookmarks((prev) =>
                        prev.map((p) =>
                          p._id === post._id
                            ? {
                                ...p,
                                score: likes,
                                votes: { ...(p.votes || {}), [(user?.id as string) || 'me']: liked ? 1 : 0 },
                              }
                            : p
                        )
                      )
                    }
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 mb-3">
                    <div
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.location.href = `/profile/${post.authorId._id}`;
                      }}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      {post.authorId.avatar ? (
                        <Image
                          src={post.authorId.avatar}
                          alt={post.authorId.name || post.authorId.email}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover border-2 border-cyan-500/40 group-hover:border-cyan-400 transition-colors shadow neon-ring"
                          unoptimized
                          suppressHydrationWarning
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-600 flex items-center justify-center text-white text-lg font-bold group-hover:from-cyan-400 group-hover:to-fuchsia-500 transition-all shadow neon-ring">
                          {(post.authorId.name || post.authorId.email || 'U').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-base text-cyan-200 group-hover:text-white">
                          {post.authorId.name || post.authorId.email}
                        </span>
                        <span
                          className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold align-middle ${
                            post.authorId.role === 'admin'
                              ? 'bg-red-500/20 text-red-300'
                              : post.authorId.role === 'moderator'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-cyan-500/20 text-cyan-300'
                          } w-fit`}
                        >
                          {post.authorId.role && post.authorId.role.trim()
                            ? post.authorId.role === 'user'
                              ? '👤 Utilizator'
                              : `👤 ${post.authorId.role}`
                            : '👤 Utilizator'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-cyan-200 mb-2 transition-colors line-clamp-2">
                    <a
                      href={`/thread/${post._id}`}
                      className="hover:text-white glitch"
                      data-text={post.title}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {post.title}
                    </a>
                  </h3>
                  <p className="text-[15px] text-slate-300 mb-4 line-clamp-3">{post.body}</p>
                  <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <MessageSquare size={14} className="text-cyan-400" />
                      <span className="text-slate-300">{post.commentsCount} comentarii</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="text-fuchsia-400" />
                      <span className="text-slate-300" suppressHydrationWarning>
                        {formatTimeAgo(post.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Tag size={14} className="text-emerald-400" />
                      <span className="px-2 py-1 bg-slate-800/60 rounded-full text-xs font-medium text-slate-200">
                        {getCategoryDisplayName(post.category)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 ml-2" data-no-nav>
                      {user && (user.role === 'admin' || user.id === post.authorId._id) && (
                        <div 
                          data-no-nav 
                          onClick={e => { 
                            e.stopPropagation(); 
                            e.preventDefault(); 
                          }}
                        >
                          <button
                            type="button"
                            onClick={e => {
                              console.log('🗑️ Delete button clicked for post:', post._id);
                              e.preventDefault();
                              e.stopPropagation();
                              handleDelete(post._id);
                            }}
                            data-no-nav
                            disabled={loading}
                            className="w-9 h-9 p-0 inline-flex items-center justify-center rounded-lg hover:bg-red-900/30 hover:text-red-400 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500/30 z-10 relative"
                            title="Șterge postarea"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                      
                      <div 
                        data-no-nav 
                        onClick={e => { 
                          e.stopPropagation(); 
                          e.preventDefault(); 
                        }}
                      >
                        <button
                          type="button"
                          onClick={e => {
                            console.log('🔖 Bookmark button clicked for post:', post._id);
                            e.preventDefault();
                            e.stopPropagation();
                            handleBookmark(post._id);
                          }}
                          data-no-nav
                          aria-label={post.bookmarkedByMe ? 'Elimină din salvate' : 'Salvează postarea'}
                          className="w-9 h-9 p-0 inline-flex items-center justify-center rounded-lg hover:bg-slate-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500/30 z-10 relative"
                          title={post.bookmarkedByMe ? 'Elimină din salvate' : 'Salvează postarea'}
                        >
                          <Bookmark
                            className={`w-5 h-5 ${post.bookmarkedByMe ? 'fill-yellow-500 text-yellow-500' : 'text-slate-400'}`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
 }
