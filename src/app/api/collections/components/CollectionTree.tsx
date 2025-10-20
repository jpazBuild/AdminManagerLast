"use client";

import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Folder } from "lucide-react";

type CollectionTreeProps = {
  colDetail: any;
  colUid: string;
  colName: string;
  httpMethodsStyle: (method: string) => string;
  onSelectRequest?: (payload: {
    colName: string;
    method: string;
    displayName: string;
    node: any;
  }) => void;
};

const CollectionTree: React.FC<CollectionTreeProps> = ({
  colDetail,
  colUid,
  colName,
  httpMethodsStyle,
  onSelectRequest,
}) => {
  const [openFolder, setOpenFolder] = useState<Record<string, boolean>>({});

  const folderKey = (uid: string, path: string[]) => `${uid}:${path.join("/")}`;
  const toggleFolderOpen = (key: string) =>
    setOpenFolder((prev) => ({ ...prev, [key]: !prev[key] }));

  const renderNode = (
    node: any,
    uid: string,
    name: string,
    path: string[] = []
  ): React.ReactNode => {
    if (!node) return null;

    const isFolder = Array.isArray(node.item) && !node.request;
    const displayName = node.name ?? node?.request?.url?.raw ?? "Untitled";

    if (isFolder) {
      const key = folderKey(uid, [...path, displayName]);
      const isOpen = !!openFolder[key];

      return (
        <li key={key} className="select-none">
          <div
            className="flex items-center gap-2 cursor-pointer text-primary/80"
            onClick={() => toggleFolderOpen(key)}
          >
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-primary" />
            ) : (
              <ChevronRight className="w-4 h-4 text-primary" />
            )}
            <Folder className="w-4 h-4 text-primary" />
            <span className="font-medium">{displayName}</span>
          </div>

          {isOpen && (
            <ul className="ml-5 mt-1 space-y-1">
              {node.item.map((child: any, idx: number) =>
                renderNode(child, uid, name, [...path, displayName, String(idx)])
              )}
            </ul>
          )}
        </li>
      );
    }

    const method = String(node?.request?.method ?? "GET").toUpperCase();
    const reqKey = `${uid}:${[...path, displayName].join("/")}`;

    return (
      <div key={reqKey} className="flex items-center gap-2">
        <span className={`${httpMethodsStyle(method)}`} title={method}>
          {method}
        </span>
        <button
          type="button"
          className="text-left truncate text-primary/85 font-medium"
          title={displayName}
          onClick={() =>
            onSelectRequest?.({ colName: name, method, displayName, node })
          }
        >
          {displayName}
        </button>
      </div>
    );
  };

  const tree = useMemo(() => {
    const items = colDetail?.data?.item ?? [];
    if (!Array.isArray(items) || items.length === 0) {
      return <p className="text-gray-500">No folders or requests</p>;
    }
    return (
      <ul className="space-y-1">
        {items.map((node: any, idx: number) =>
          renderNode(node, colUid, colName, [String(idx)])
        )}
      </ul>
    );
  }, [colDetail, colUid, colName, openFolder]);

  return <>{tree}</>;
};

export default CollectionTree;
