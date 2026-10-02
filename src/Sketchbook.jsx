import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router";

import { supabase } from "./lib/supabaseClient";


/* =========================
   SKETCHBOOK HEADER
========================= */

function SketchbookHeader() {
  return (
    <header className="header">
      <Link
        to="/"
        className="logo"
      >
        KARTHIK
      </Link>

      <nav className="nav">
        <Link to="/shop">
          SHOP
        </Link>

        <Link to="/commission">
          COMMISSION
        </Link>

        <Link
          to="/blog"
          className="blog-link"
        >
          BLOG
        </Link>

        <Link to="/sketchbook">
          SKETCHBOOK
        </Link>

        <Link to="/playground">
          PLAYGROUND
        </Link>

        <Link to="/about">
          ABOUT ME
        </Link>
      </nav>
    </header>
  );
}


/* =========================
   STORAGE URL
========================= */

function getPublicUrl(path) {
  if (!path) {
    return "";
  }

  const { data } =
    supabase.storage
      .from("sketchbooks")
      .getPublicUrl(path);

  return data.publicUrl;
}


/* =========================
   ARCHIVE
========================= */

function SketchbookArchive() {
  const [books, setBooks] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {
    async function fetchBooks() {
      const {
        data,
        error,
      } = await supabase
        .from("sketchbooks")
        .select("*")
        .eq(
          "published",
          true
        )
        .order(
          "sort_order",
          {
            ascending: true,
          }
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (error) {
        console.error(
          "SKETCHBOOK LOAD ERROR:",
          error
        );

        setError(
          error.message
        );

        setLoading(false);

        return;
      }

      setBooks(
        data || []
      );

      setLoading(false);
    }

    fetchBooks();
  }, []);


  return (
    <>
      <SketchbookHeader />

      <main className="sketchbook-archive-page">

        <section className="sketchbook-archive-heading">

          <span>
            ARCHIVE
          </span>

          <h1>
            SKETCHBOOK
          </h1>

          <p>
            Pages, scribbles,
            unfinished ideas and
            things from the studio.
          </p>

        </section>


        {loading && (
          <div className="sketchbook-status">
            LOADING SKETCHBOOKS...
          </div>
        )}


        {!loading &&
          error && (
            <div className="sketchbook-status sketchbook-status-error">
              {error}
            </div>
          )}


        {!loading &&
          !error &&
          books.length === 0 && (
            <div className="sketchbook-status">
              NO SKETCHBOOKS YET.
            </div>
          )}


        {!loading &&
          !error &&
          books.length > 0 && (
            <section className="sketchbook-archive-grid">

              {books.map(
                (book) => (
                  <Link
                    key={book.id}
                    to={`/sketchbook/${book.id}`}
                    className="sketchbook-archive-card"
                  >

                    <div className="sketchbook-archive-cover">

                      <img
                        src={getPublicUrl(
                          book.cover_path
                        )}
                        alt={
                          book.title
                        }
                      />

                    </div>


                    <div className="sketchbook-archive-info">

                      <h2>
                        {book.title}
                      </h2>

                      <span>
                        {book.year || ""}
                      </span>

                    </div>

                  </Link>
                )
              )}

            </section>
          )}

      </main>
    </>
  );
}


/* =========================
   VIEWER
========================= */

function SketchbookViewer() {
  const { id } =
    useParams();

  const navigate =
    useNavigate();

  const [book, setBook] =
    useState(null);

  const [pages, setPages] =
    useState([]);

  const [currentPage, setCurrentPage] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {
    async function fetchBook() {
      setLoading(true);
      setError("");

      const {
        data: bookData,
        error: bookError,
      } = await supabase
        .from("sketchbooks")
        .select("*")
        .eq("id", id)
        .eq("published", true)
        .single();

      if (bookError) {
        console.error(
          "BOOK ERROR:",
          bookError
        );

        setError(
          "Sketchbook not found."
        );

        setLoading(false);

        return;
      }


      const {
        data: pageData,
        error: pageError,
      } = await supabase
        .from("sketchbook_pages")
        .select("*")
        .eq(
          "sketchbook_id",
          id
        )
        .order(
          "page_number",
          {
            ascending: true,
          }
        );

      if (pageError) {
        console.error(
          "PAGE ERROR:",
          pageError
        );

        setError(
          pageError.message
        );

        setLoading(false);

        return;
      }


      setBook(
        bookData
      );

      setPages(
        pageData || []
      );

      setCurrentPage(0);

      setLoading(false);
    }

    fetchBook();
  }, [id]);


  /* =========================
     NAVIGATION
  ========================= */

  function nextPage() {
    setCurrentPage(
      (current) =>
        Math.min(
          current + 1,
          pages.length
        )
    );
  }


  function previousPage() {
    setCurrentPage(
      (current) =>
        Math.max(
          current - 1,
          0
        )
    );
  }


  /* =========================
     KEYBOARD
  ========================= */

  useEffect(() => {
    function handleKeyboard(
      event
    ) {
      if (
        event.key === "ArrowRight" ||
        event.key === ">"
      ) {
        nextPage();
      }

      if (
        event.key === "ArrowLeft" ||
        event.key === "<"
      ) {
        previousPage();
      }

      if (
        event.key === "Escape"
      ) {
        navigate(
          "/sketchbook"
        );
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyboard
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboard
      );
    };
  });


  if (loading) {
    return (
      <div className="sketchbook-viewer">
        <div className="sketchbook-status">
          OPENING SKETCHBOOK...
        </div>
      </div>
    );
  }


  if (error || !book) {
    return (
      <div className="sketchbook-viewer">

        <button
          type="button"
          className="sketchbook-viewer-back"
          onClick={() =>
            navigate(
              "/sketchbook"
            )
          }
        >
          ← BACK
        </button>

        <div className="sketchbook-status sketchbook-status-error">
          {error}
        </div>

      </div>
    );
  }


  /*
    PAGE 0 = COVER
    PAGE 1 = FIRST UPLOADED PAGE
  */

  const imagePath =
    currentPage === 0
      ? book.cover_path
      : pages[
          currentPage - 1
        ]?.image_path;


  return (
    <div className="sketchbook-viewer">

      <button
        type="button"
        className="sketchbook-viewer-back"
        onClick={() =>
          navigate(
            "/sketchbook"
          )
        }
      >
        ← BACK TO SKETCHBOOK
      </button>


      <div className="sketchbook-viewer-title">

        <span>
          {book.title}
        </span>

        <span>
          {currentPage + 1}
          {" / "}
          {pages.length + 1}
        </span>

      </div>


      <button
        type="button"
        className="sketchbook-viewer-arrow sketchbook-viewer-arrow-left"
        onClick={
          previousPage
        }
        disabled={
          currentPage === 0
        }
      >
        ‹
      </button>


      <div className="sketchbook-viewer-page">

        {imagePath && (
          <img
            src={getPublicUrl(
              imagePath
            )}
            alt={`${book.title} page ${
              currentPage + 1
            }`}
          />
        )}

      </div>


      <button
        type="button"
        className="sketchbook-viewer-arrow sketchbook-viewer-arrow-right"
        onClick={
          nextPage
        }
        disabled={
          currentPage >=
          pages.length
        }
      >
        ›
      </button>


      <div className="sketchbook-viewer-counter">
        {currentPage + 1}
        {" / "}
        {pages.length + 1}
      </div>

    </div>
  );
}


/* =========================
   PAGE ENTRY
========================= */

export default function SketchbookPage() {
  const { id } =
    useParams();

  return id ? (
    <SketchbookViewer />
  ) : (
    <SketchbookArchive />
  );
}