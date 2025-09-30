// DataTable.js
import { useState } from 'react';

export default function DataTable({ data, fields = [], onEdit }) {
  
  return (
    <>
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            {fields.map(f => (
              <th key={f.name} className="py-2 px-4 border">{f.name}</th>
            ))}
            <th className="py-2 px-4 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item._id} className="hover:bg-gray-100">
              {fields.map(f => (
                <td key={f.name} className="py-2 px-4 border">{item[f.name]}</td>
              ))}
              <td className="py-2 px-4 border">
                <button
                  className="bg-blue-500 text-white px-2 py-1 rounded mr-2"
                  onClick={() => setEditingItem(item)}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    
    </>
  );
}
