import {
  useEffect,
  useState,
} from "react";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import { supabase } from "./lib/supabaseClient";


/* =========================================================
   HELPERS
========================================================= */

function uniqueId() {
  return (
    `${Date.now()}-` +
    Math.random()
      .toString(36)
      .slice(2, 10)
  );
}


function publicUrl(path) {
  if (!path) return "";

  const { data } =
    supabase.storage
      .from("sketchbooks")
      .getPublicUrl(path);

  return data.publicUrl;
}


/* =========================================================
   IMAGE COMPRESSION
========================================================= */

async function prepareSketchbookImageForUpload(file) {
  if (!file) return null;

  if (!file.type.startsWith("image/")) {
    throw new Error(
      "Only image files are allowed."
    );
  }

  const MAX_SIZE = 2000;

  const image = new Image();

  const objectUrl =
    URL.createObjectURL(file);

  try {
    await new Promise(
      (resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = objectUrl;
      }
    );

    let width = image.width;
    let height = image.height;

    if (
      width > MAX_SIZE ||
      height > MAX_SIZE
    ) {
      const scale = Math.min(
        MAX_SIZE / width,
        MAX_SIZE / height
      );

      width = Math.round(
        width * scale
      );

      height = Math.round(
        height * scale
      );
    }

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width = width;
    canvas.height = height;

    const ctx =
      canvas.getContext("2d");

    if (!ctx) {
      throw new Error(
        "Could not process image."
      );
    }

    ctx.drawImage(
      image,
      0,
      0,
      width,
      height
    );

    const blob =
      await new Promise(
        (resolve) => {
          canvas.toBlob(
            resolve,
            "image/jpeg",
            0.88
          );
        }
      );

    if (!blob) {
      throw new Error(
        "Could not compress image."
      );
    }

    const fileName =
      file.name.replace(
        /\.[^/.]+$/,
        ".jpg"
      );

    return new File(
      [blob],
      fileName,
      {
        type: "image/jpeg",
        lastModified: Date.now(),
      }
    );
  } finally {
    URL.revokeObjectURL(
      objectUrl
    );
  }
}


/* =========================================================
   UPLOAD
========================================================= */

async function uploadFile(
  file,
  folder
) {
  const preparedFile =
    await prepareSketchbookImageForUpload(
      file
    );

  const id = uniqueId();

  const safeName =
    preparedFile.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(
        /[^a-z0-9._-]/g,
        ""
      );

  const filePath =
    `${folder}/${id}-${safeName}`;

  const { error } =
    await supabase.storage
      .from("sketchbooks")
      .upload(
        filePath,
        preparedFile,
        {
          cacheControl:
            "31536000",
          upsert: false,
          contentType:
            "image/jpeg",
        }
      );

  if (error) {
    throw error;
  }

  return filePath;
}


/* =========================================================
   SORTABLE PAGE
========================================================= */

function SortablePage({
  item,
  index,
  onRemove,
  onReplace,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } =
    useSortable({
      id: item.key,
    });

  const style = {
    transform:
      CSS.Transform.toString(
        transform
      ),
    transition,
    opacity: isDragging
      ? 0.35
      : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sketchbook-sortable-page ${
        isDragging
          ? "is-dragging"
          : ""
      }`}
    >

      {/* THUMBNAIL */}

      <div className="sketchbook-page-thumb">
        <img
          src={item.preview}
          alt=""
          draggable="false"
        />
      </div>


      {/* INFO */}

      <div className="sketchbook-page-info">

        <strong>
          PAGE {index + 2}
        </strong>

        <span>
          {item.type === "existing"
            ? item.replacementFile
              ? "IMAGE REPLACED"
              : "EXISTING PAGE"
            : "NEW PAGE"}
        </span>

        <small>
          {item.name}
        </small>

      </div>


      {/* ACTIONS */}

      <div className="sketchbook-page-actions">

        <label
          className="sketchbook-page-action"
        >
          REPLACE

          <input
            id={`replace-${item.key}`}
            type="file"
            accept="image/*"
            onChange={(event) =>
              onReplace(
                item.key,
                event.target
                  .files?.[0] ||
                  null
              )
            }
          />
        </label>


        <button
          type="button"
          className="sketchbook-page-action"
          onClick={() =>
            onRemove(item.key)
          }
        >
          REMOVE
        </button>


        <button
          type="button"
          className="sketchbook-page-drag"
          {...attributes}
          {...listeners}
          aria-label="Drag page"
        >
          ⠿
        </button>

      </div>

    </div>
  );
}


/* =========================================================
   ADMIN SKETCHBOOKS
========================================================= */

export default function AdminSketchbooks({
  setError,
  setSuccess,
}) {
  const [books, setBooks] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [editingBook, setEditingBook] =
    useState(null);


  /* FORM */

  const [title, setTitle] =
    useState("");

  const [year, setYear] =
    useState(
      new Date().getFullYear()
    );

  const [description, setDescription] =
    useState("");

  const [published, setPublished] =
    useState(true);

  const [coverFile, setCoverFile] =
    useState(null);


  /* ALL PAGES IN ORDER */

  const [pageItems, setPageItems] =
    useState([]);


  /* CURRENT DRAG */

  const [activeId, setActiveId] =
    useState(null);


  /* DND */

  const sensors =
    useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 8,
        },
      }),

      useSensor(TouchSensor, {
        activationConstraint: {
          delay: 150,
          tolerance: 8,
        },
      })
    );


  /* =======================================================
     FETCH BOOKS
  ======================================================= */

  async function fetchBooks() {
    setLoading(true);

    const {
      data,
      error,
    } = await supabase
      .from("sketchbooks")
      .select("*")
      .order("sort_order", {
        ascending: true,
      })
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);

      setError(
        error.message
      );

      setLoading(false);

      return;
    }

    const prepared =
      await Promise.all(
        (data || []).map(
          async (book) => {
            const {
              count,
            } = await supabase
              .from(
                "sketchbook_pages"
              )
              .select(
                "*",
                {
                  count:
                    "exact",
                  head: true,
                }
              )
              .eq(
                "sketchbook_id",
                book.id
              );

            return {
              ...book,

              page_count:
                count || 0,
            };
          }
        )
      );

    setBooks(
      prepared
    );

    setLoading(false);
  }


  useEffect(() => {
    fetchBooks();
  }, []);


  /* =======================================================
     CLEANUP PREVIEWS
  ======================================================= */

  function cleanupPagePreviews(
    items
  ) {
    items.forEach((item) => {
      if (
        item.type === "new" ||
        item.replacementFile
      ) {
        if (
          item.preview &&
          item.preview.startsWith(
            "blob:"
          )
        ) {
          URL.revokeObjectURL(
            item.preview
          );
        }
      }
    });
  }


  /* =======================================================
     RESET
  ======================================================= */

  function resetForm() {
    cleanupPagePreviews(
      pageItems
    );

    setEditingBook(null);

    setTitle("");

    setYear(
      new Date().getFullYear()
    );

    setDescription("");

    setPublished(true);

    setCoverFile(null);

    setPageItems([]);

    setActiveId(null);

    const coverInput =
      document.getElementById(
        "sketchbook-cover"
      );

    const pagesInput =
      document.getElementById(
        "sketchbook-pages"
      );

    if (coverInput) {
      coverInput.value = "";
    }

    if (pagesInput) {
      pagesInput.value = "";
    }
  }


  /* =======================================================
     START EDIT
  ======================================================= */

  async function startEdit(book) {
    setError("");
    setSuccess("");

    const {
      data,
      error,
    } = await supabase
      .from("sketchbook_pages")
      .select("*")
      .eq(
        "sketchbook_id",
        book.id
      )
      .order(
        "page_number",
        {
          ascending: true,
        }
      );

    if (error) {
      setError(
        error.message
      );

      return;
    }


    const items =
      (data || []).map(
        (page) => ({
          key:
            `existing-${page.id}`,

          type:
            "existing",

          id:
            page.id,

          image_path:
            page.image_path,

          preview:
            publicUrl(
              page.image_path
            ),

          name:
            `Existing page`,

          replacementFile:
            null,
        })
      );


    setEditingBook(book);

    setTitle(
      book.title || ""
    );

    setYear(
      book.year ||
      new Date().getFullYear()
    );

    setDescription(
      book.description || ""
    );

    setPublished(
      Boolean(
        book.published
      )
    );

    setCoverFile(null);

    setPageItems(items);

    setActiveId(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  /* =======================================================
     ADD PAGES
  ======================================================= */

  function addPageFiles(event) {
    const incoming =
      Array.from(
        event.target.files || []
      );

    if (
      incoming.length === 0
    ) {
      return;
    }

    const newItems =
      incoming.map(
        (file) => ({
          key:
            `new-${uniqueId()}-${Math.random()
              .toString(36)
              .slice(2, 6)}`,

          type:
            "new",

          file,

          preview:
            URL.createObjectURL(
              file
            ),

          name:
            file.name,

          replacementFile:
            null,
        })
      );

    setPageItems(
      (current) => [
        ...current,
        ...newItems,
      ]
    );

    event.target.value = "";
  }


  /* =======================================================
     REPLACE PAGE
  ======================================================= */

  function replacePage(
    key,
    file
  ) {
    if (!file) {
      return;
    }

    const preview =
      URL.createObjectURL(
        file
      );

    setPageItems(
      (current) =>
        current.map(
          (item) => {
            if (
              item.key !== key
            ) {
              return item;
            }

            if (
              item.preview &&
              item.preview.startsWith(
                "blob:"
              )
            ) {
              URL.revokeObjectURL(
                item.preview
              );
            }

            if (
              item.type ===
              "existing"
            ) {
              return {
                ...item,

                replacementFile:
                  file,

                preview,

                name:
                  file.name,
              };
            }

            return {
              ...item,

              file,

              preview,

              name:
                file.name,
            };
          }
        )
    );
  }


  /* =======================================================
     REMOVE PAGE
  ======================================================= */

  function removePage(
    key
  ) {
    setPageItems(
      (current) => {
        const item =
          current.find(
            (page) =>
              page.key === key
          );

        if (
          item?.preview &&
          item.preview.startsWith(
            "blob:"
          )
        ) {
          URL.revokeObjectURL(
            item.preview
          );
        }

        return current.filter(
          (page) =>
            page.key !== key
        );
      }
    );
  }


  /* =======================================================
     DRAG
  ======================================================= */

  function handleDragStart(
    event
  ) {
    setActiveId(
      event.active.id
    );
  }


  function handleDragCancel() {
    setActiveId(null);
  }


  function handleDragEnd(
    event
  ) {
    const {
      active,
      over,
    } = event;

    setActiveId(null);

    if (!over) {
      return;
    }

    if (
      active.id === over.id
    ) {
      return;
    }

    setPageItems(
      (current) => {
        const oldIndex =
          current.findIndex(
            (item) =>
              item.key ===
              active.id
          );

        const newIndex =
          current.findIndex(
            (item) =>
              item.key ===
              over.id
          );

        if (
          oldIndex === -1 ||
          newIndex === -1
        ) {
          return current;
        }

        return arrayMove(
          current,
          oldIndex,
          newIndex
        );
      }
    );
  }


  /* =======================================================
     SAVE
  ======================================================= */

  async function saveSketchbook(
    event
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError(
        "Sketchbook title is required."
      );

      return;
    }

    if (
      !editingBook &&
      !coverFile
    ) {
      setError(
        "Choose a cover image."
      );

      return;
    }

    setSaving(true);

    try {
      let coverPath =
        editingBook
          ? editingBook.cover_path
          : null;

      const oldCoverPath =
        editingBook
          ? editingBook.cover_path
          : null;


      /* ---------------------------------------------------
         COVER
      --------------------------------------------------- */

      if (coverFile) {
        coverPath =
          await uploadFile(
            coverFile,
            "covers"
          );
      }


      /* ===================================================
         CREATE
      =================================================== */

      if (!editingBook) {
        const {
          data: newBook,
          error: insertError,
        } =
          await supabase
            .from(
              "sketchbooks"
            )
            .insert({
              title:
                title.trim(),

              description:
                description.trim(),

              year:
                year === ""
                  ? null
                  : Number(year),

              cover_path:
                coverPath,

              published,

              sort_order:
                books.length + 1,
            })
            .select()
            .single();

        if (insertError) {
          if (coverPath) {
            await supabase.storage
              .from("sketchbooks")
              .remove([
                coverPath,
              ]);
          }

          throw insertError;
        }


        /* PAGES */

        for (
          let i = 0;
          i < pageItems.length;
          i++
        ) {
          const item =
            pageItems[i];

          const path =
            await uploadFile(
              item.file,
              `pages/${newBook.id}`
            );

          const {
            error,
          } =
            await supabase
              .from(
                "sketchbook_pages"
              )
              .insert({
                sketchbook_id:
                  newBook.id,

                page_number:
                  i + 2,

                image_path:
                  path,
              });

          if (error) {
            await supabase.storage
              .from("sketchbooks")
              .remove([
                path,
              ]);

            throw error;
          }
        }

        setSuccess(
          "Sketchbook added."
        );
      }


      /* ===================================================
         EDIT
      =================================================== */

      else {
        const {
          error:
            updateError,
        } =
          await supabase
            .from(
              "sketchbooks"
            )
            .update({
              title:
                title.trim(),

              description:
                description.trim(),

              year:
                year === ""
                  ? null
                  : Number(year),

              cover_path:
                coverPath,

              published,

              updated_at:
                new Date().toISOString(),
            })
            .eq(
              "id",
              editingBook.id
            );

        if (updateError) {
          if (
            coverPath &&
            coverPath !== oldCoverPath
          ) {
            await supabase.storage
              .from("sketchbooks")
              .remove([
                coverPath,
              ]);
          }

          throw updateError;
        }


        /* -------------------------------------------------
           GET STORED PAGES
        ------------------------------------------------- */

        const {
          data: storedPages,
          error:
            storedPagesError,
        } =
          await supabase
            .from(
              "sketchbook_pages"
            )
            .select("*")
            .eq(
              "sketchbook_id",
              editingBook.id
            );

        if (storedPagesError) {
          throw storedPagesError;
        }


        /* -------------------------------------------------
           REMOVE DELETED PAGES
        ------------------------------------------------- */

        const keptIds =
          new Set(
            pageItems
              .filter(
                (item) =>
                  item.type ===
                  "existing"
              )
              .map(
                (item) =>
                  item.id
              )
          );

        const removedPages =
          (
            storedPages ||
            []
          ).filter(
            (page) =>
              !keptIds.has(
                page.id
              )
          );

        if (
          removedPages.length > 0
        ) {
          const paths =
            removedPages.map(
              (page) =>
                page.image_path
            );

          const {
            error:
              storageDeleteError,
          } =
            await supabase.storage
              .from("sketchbooks")
              .remove(paths);

          if (
            storageDeleteError
          ) {
            throw storageDeleteError;
          }

          const ids =
            removedPages.map(
              (page) =>
                page.id
            );

          const {
            error:
              pageDeleteError,
          } =
            await supabase
              .from(
                "sketchbook_pages"
              )
              .delete()
              .in(
                "id",
                ids
              );

          if (
            pageDeleteError
          ) {
            throw pageDeleteError;
          }
        }


        /* -------------------------------------------------
           TEMPORARY PAGE NUMBERS

           This prevents the UNIQUE constraint from
           breaking when pages are reordered.
        ------------------------------------------------- */

        const existingItems =
          pageItems.filter(
            (item) =>
              item.type ===
              "existing"
          );

        for (
          let i = 0;
          i < existingItems.length;
          i++
        ) {
          const item =
            existingItems[i];

          const {
            error,
          } =
            await supabase
              .from(
                "sketchbook_pages"
              )
              .update({
                page_number:
                  -(i + 1),
              })
              .eq(
                "id",
                item.id
              );

          if (error) {
            throw error;
          }
        }


        /* -------------------------------------------------
           WRITE FINAL ORDER
        ------------------------------------------------- */

        for (
          let i = 0;
          i < pageItems.length;
          i++
        ) {
          const item =
            pageItems[i];

          const finalPageNumber =
            i + 2;


          /* EXISTING */

          if (
            item.type ===
            "existing"
          ) {
            let imagePath =
              item.image_path;

            const oldImagePath =
              item.image_path;


            if (
              item.replacementFile
            ) {
              imagePath =
                await uploadFile(
                  item.replacementFile,
                  `pages/${editingBook.id}`
                );
            }


            const {
              error,
            } =
              await supabase
                .from(
                  "sketchbook_pages"
                )
                .update({
                  page_number:
                    finalPageNumber,

                  image_path:
                    imagePath,
                })
                .eq(
                  "id",
                  item.id
                );

            if (error) {
              if (
                imagePath !==
                oldImagePath
              ) {
                await supabase.storage
                  .from(
                    "sketchbooks"
                  )
                  .remove([
                    imagePath,
                  ]);
              }

              throw error;
            }


            if (
              imagePath !==
              oldImagePath
            ) {
              await supabase.storage
                .from(
                  "sketchbooks"
                )
                .remove([
                  oldImagePath,
                ]);
            }
          }


          /* NEW */

          else {
            const path =
              await uploadFile(
                item.file,
                `pages/${editingBook.id}`
              );

            const {
              error,
            } =
              await supabase
                .from(
                  "sketchbook_pages"
                )
                .insert({
                  sketchbook_id:
                    editingBook.id,

                  page_number:
                    finalPageNumber,

                  image_path:
                    path,
                });

            if (error) {
              await supabase.storage
                .from(
                  "sketchbooks"
                )
                .remove([
                  path,
                ]);

              throw error;
            }
          }
        }


        /* -------------------------------------------------
           REMOVE OLD COVER IF REPLACED
        ------------------------------------------------- */

        if (
          coverPath &&
          oldCoverPath &&
          coverPath !==
            oldCoverPath
        ) {
          await supabase.storage
            .from("sketchbooks")
            .remove([
              oldCoverPath,
            ]);
        }

        setSuccess(
          "Sketchbook updated."
        );
      }


      resetForm();

      await fetchBooks();

    } catch (error) {
      console.error(
        "SKETCHBOOK ERROR:",
        error
      );

      setError(
        error?.message ||
          "Could not save sketchbook."
      );
    } finally {
      setSaving(false);
    }
  }


  /* =======================================================
     DELETE BOOK
  ======================================================= */

  async function deleteSketchbook(
    book
  ) {
    const confirmed =
      window.confirm(
        `Delete "${book.title}" and all its pages?`
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const {
        data: pages,
        error:
          pageError,
      } =
        await supabase
          .from(
            "sketchbook_pages"
          )
          .select(
            "image_path"
          )
          .eq(
            "sketchbook_id",
            book.id
          );

      if (pageError) {
        throw pageError;
      }


      const paths = [
        book.cover_path,

        ...(pages || []).map(
          (page) =>
            page.image_path
        ),
      ];


      const {
        error:
          storageError,
      } =
        await supabase.storage
          .from("sketchbooks")
          .remove(paths);

      if (storageError) {
        throw storageError;
      }


      const {
        error,
      } =
        await supabase
          .from("sketchbooks")
          .delete()
          .eq(
            "id",
            book.id
          );

      if (error) {
        throw error;
      }

      setSuccess(
        "Sketchbook deleted."
      );

      await fetchBooks();

    } catch (error) {
      console.error(error);

      setError(
        error?.message ||
          "Could not delete sketchbook."
      );
    }
  }


  /* =======================================================
     ACTIVE DRAG ITEM
  ======================================================= */

  const activeItem =
    pageItems.find(
      (item) =>
        item.key ===
        activeId
    ) || null;


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section className="admin-sketchbooks">

      {/* HEADER */}

      <div className="admin-form-heading">

        <div>

          <p className="admin-kicker">
            NOTEBOOK ARCHIVE
          </p>

          <h2>
            {editingBook
              ? "EDIT SKETCHBOOK"
              : "ADD SKETCHBOOK"}
          </h2>

          <p>
            One cover. One page stack.
            Drag to reorder.
          </p>

        </div>


        {editingBook && (
          <button
            type="button"
            className="admin-cancel"
            onClick={resetForm}
          >
            CANCEL EDIT
          </button>
        )}

      </div>


      {/* FORM */}

      <form
        className="admin-sketchbook-form"
        onSubmit={
          saveSketchbook
        }
      >

        {/* COVER */}

        <div className="sketchbook-image-upload">

          <label>

            COVER / PAGE 1

            <input
              id="sketchbook-cover"
              type="file"
              accept="image/*"
              onChange={(
                event
              ) =>
                setCoverFile(
                  event.target
                    .files?.[0] ||
                    null
                )
              }
              required={
                !editingBook
              }
            />

            {coverFile && (
              <strong className="sketchbook-file-name">
                {coverFile.name}
              </strong>
            )}

            {editingBook &&
              !coverFile && (
                <small className="sketchbook-file-note">
                  Current cover remains
                  unchanged.
                </small>
              )}

          </label>

        </div>


        {/* BASIC INFO */}

        <div className="sketchbook-form-grid">

          <label>

            TITLE

            <input
              type="text"
              value={title}
              onChange={(
                event
              ) =>
                setTitle(
                  event.target.value
                )
              }
              placeholder="Sketchbook 01"
              required
            />

          </label>


          <label>

            YEAR

            <input
              type="number"
              value={year}
              onChange={(
                event
              ) =>
                setYear(
                  event.target.value
                )
              }
            />

          </label>

        </div>


        {/* DESCRIPTION */}

        <label>

          DESCRIPTION

          <textarea
            rows="5"
            value={description}
            onChange={(
              event
            ) =>
              setDescription(
                event.target.value
              )
            }
            placeholder="A collection of studies, pages, ideas..."
          />

        </label>


        {/* ADD PAGES */}

        <div className="sketchbook-pages-upload">

          <label>

            ADD PAGES

            <input
              id="sketchbook-pages"
              type="file"
              accept="image/*"
              multiple
              onChange={
                addPageFiles
              }
            />

          </label>

          <p className="sketchbook-upload-help">
            Add multiple images.
            Then drag them into the
            exact order you want.
          </p>

        </div>


        {/* PAGE EDITOR */}

        <div className="sketchbook-page-editor-section">

          <div className="sketchbook-editor-heading">

            <strong>
              PAGE ORDER
            </strong>

            <span>
              {pageItems.length} IMAGE PAGES
            </span>

          </div>


          <DndContext
            sensors={sensors}
            collisionDetection={
              closestCenter
            }
            onDragStart={
              handleDragStart
            }
            onDragEnd={
              handleDragEnd
            }
            onDragCancel={
              handleDragCancel
            }
          >

            {pageItems.length ===
            0 ? (
              <div className="sketchbook-page-editor-empty">
                ADD SOME PAGES ABOVE
              </div>
            ) : (
              <div className="sketchbook-page-editor">

                <SortableContext
                  items={pageItems.map(
                    (item) =>
                      item.key
                  )}
                  strategy={
                    verticalListSortingStrategy
                  }
                >

                  {pageItems.map(
                    (
                      item,
                      index
                    ) => (
                      <SortablePage
                        key={
                          item.key
                        }
                        item={
                          item
                        }
                        index={
                          index
                        }
                        onRemove={
                          removePage
                        }
                        onReplace={
                          replacePage
                        }
                      />
                    )
                  )}

                </SortableContext>

              </div>
            )}


            <DragOverlay>
              {activeItem ? (
                <div className="sketchbook-sortable-page sketchbook-page-overlay">

                  <div className="sketchbook-page-thumb">
                    <img
                      src={
                        activeItem.preview
                      }
                      alt=""
                    />
                  </div>

                  <div className="sketchbook-page-info">
                    <strong>
                      PAGE{" "}
                      {pageItems.findIndex(
                        (item) =>
                          item.key ===
                          activeItem.key
                      ) + 2}
                    </strong>

                    <span>
                      DRAGGING
                    </span>

                    <small>
                      {
                        activeItem.name
                      }
                    </small>
                  </div>

                  <div className="sketchbook-page-drag">
                    ⠿
                  </div>

                </div>
              ) : null}
            </DragOverlay>

          </DndContext>

        </div>


        {/* PUBLISH */}

        <div className="sketchbook-publish">

          <label className="checkbox-label">

            <input
              type="checkbox"
              checked={
                published
              }
              onChange={(
                event
              ) =>
                setPublished(
                  event.target
                    .checked
                )
              }
            />

            PUBLISH SKETCHBOOK

          </label>

        </div>


        {/* SAVE */}

        <button
          type="submit"
          className="admin-button"
          disabled={saving}
        >
          {saving
            ? "SAVING..."
            : editingBook
            ? "SAVE CHANGES"
            : "PUBLISH SKETCHBOOK"}
        </button>

      </form>


      {/* ===================================================
         EXISTING BOOKS
      =================================================== */}

      <section className="admin-sketchbook-list">

        <div className="admin-section-heading">

          <h2>
            YOUR SKETCHBOOKS
          </h2>

          <span>
            {books.length} BOOKS
          </span>

        </div>


        {loading ? (
          <p>
            Loading sketchbooks...
          </p>
        ) : books.length ===
          0 ? (
          <p>
            No sketchbooks yet.
          </p>
        ) : (
          <div className="admin-sketchbook-items">

            {books.map(
              (book) => (
                <article
                  className="admin-sketchbook-item"
                  key={book.id}
                >

                  <img
                    src={publicUrl(
                      book.cover_path
                    )}
                    alt={
                      book.title
                    }
                  />


                  <div className="admin-sketchbook-item-info">

                    <h3>
                      {book.title}
                    </h3>

                    <p>
                      {book.year}
                      {" · "}
                      {book.page_count}
                      {" "}
                      IMAGE PAGES
                    </p>

                    <small>
                      {book.published
                        ? "PUBLISHED"
                        : "DRAFT"}
                    </small>

                  </div>


                  <div className="admin-row-buttons">

                    <button
                      type="button"
                      className="edit-button"
                      onClick={() =>
                        startEdit(
                          book
                        )
                      }
                    >
                      EDIT
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() =>
                        deleteSketchbook(
                          book
                        )
                      }
                    >
                      DELETE
                    </button>

                  </div>

                </article>
              )
            )}

          </div>
        )}

      </section>

    </section>
  );
}