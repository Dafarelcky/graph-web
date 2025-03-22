import React from 'react';
import { Link } from 'react-router-dom';

function Sidebar() {
  return (
    <div className="d-flex flex-column align-items-start p-3">
      <h2 className="text-light">Menu</h2>
      <ul className="nav flex-column">
        <li className="nav-item">
          <Link to="/" className="nav-link text-light">
            Home
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/graph" className="nav-link text-light">
            Graph
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;