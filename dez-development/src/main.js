import InitPopups from './js/popup.js';
import MobileMenu from './js/mobile-menu.js';
import TestimSlider from './js/testimonials.js';
import TestimonialsLoadMore from './js/testimonials-loadmore.js';
import { PropertyGallery, PropertyFloorTabs } from './js/property.js';
import ArchiveView from './js/archive-view.js';
import CommunityMap from './js/community-map';
import CommunityFilter from './js/community-filter.js';
import PropertyFilter from './js/property-filter.js';
import HeroSearch from './js/hero-search.js';
import CF7UI from './js/cf7-ui.js';
import ContentDoc from './js/content-doc.js';
import Gallery from './js/gallery.js';

import './js/header-submenu';
import './scss/main.scss';

/*
 * On DOM Content Load
 */
document.addEventListener('DOMContentLoaded', () => {
	InitPopups();
	MobileMenu();
	TestimSlider();
	TestimonialsLoadMore();
	PropertyGallery();
	PropertyFloorTabs();
	ArchiveView();

	HeroSearch();
	CF7UI();
	ContentDoc();
	Gallery();

	//Load  Filter
	CommunityFilter();


	// Чомусь була проблема з ініціалізацією мапи. Тому довелось запускати з делеєм
	const targetId = 'community-map';
	function checkAndRunMap() {
		const el = document.getElementById(targetId);
		if (typeof google === 'undefined' || !google.maps) {
			return;
		}
		clearInterval(mapTimer);
		console.log("Ready....");
		const map = new CommunityMap(targetId);
		map.init();
	}

	const mapTimer = setInterval(checkAndRunMap, 100);

});

/*
 * On Full Page Load
 */
window.addEventListener('load', () => {});


