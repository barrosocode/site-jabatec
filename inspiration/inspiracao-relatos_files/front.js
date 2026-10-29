( function() {
	const html = document.querySelector( 'html' );
	const notice = document.querySelector( '.easy-notification-bar' );

	const cleanup = () => {
		html.classList.remove( 'easy-notification-bar-is-disabled' );
		const styleSheet = document.querySelector( '#easy-notification-bar-css' );
		if ( styleSheet ) {
			styleSheet.remove();
		}
		const inlineStyle = document.querySelector( '#easy-notification-bar-inline-css' );
		if ( inlineStyle ) {
			inlineStyle.remove();
		}
		const script = document.querySelector( '#easy-notification-bar-js' );
		if ( script ) {
			script.remove();
		}
		const scriptExtras = document.querySelector( '#easy-notification-bar-js-extra' );
		if ( scriptExtras ) {
			scriptExtras.remove();
		}
	};

	if ( notice && html && html.classList.contains( 'easy-notification-bar-is-disabled' ) ) {
		notice.remove();
		cleanup();
	}

	const removeOldKeys = function() {
		var oldKeys = [];
		for (let i = 0; i < localStorage.length; i++){
			if ( 'easy_notification_bar_is_hidden' === localStorage.key(i).substring(0,31) ) {
				oldKeys.push(localStorage.key(i));
			}
		}
		for (let i = 0; i < oldKeys.length; i++) {
			localStorage.removeItem(oldKeys[i]);
		}
	};

	const getLocalStorageKeyName = () => {
		if ( 'object' === typeof easyNotificationBar ) {
			return easyNotificationBar.local_storage_keyname || 'easy_notification_bar_is_hidden';
		} else {
			return 'easy_notification_bar_is_hidden';
		}
	}

	document.addEventListener( 'click', (e) => {
		const toggle = e.target.closest( '[data-easy-notification-bar-close]' );

		if ( ! toggle ) {
			return;
		}

		const isButtonLink = toggle.classList.contains( 'easy-notification-bar-button__link' );

		if ( ! isButtonLink || ( isButtonLink && '#' === toggle.getAttribute( 'href' ) ) ) {
			e.preventDefault();
		}

		const notice = document.querySelector( '.easy-notification-bar' );

		if ( notice ) {
			notice.remove();
		}

		if ( html ) {
			html.classList.remove( 'has-easy-notification-bar' );
		}

		if ( 'undefined' !== typeof localStorage ) {
			removeOldKeys();
			localStorage.setItem( getLocalStorageKeyName(), 'yes' );
			toggle.dispatchEvent( new CustomEvent( 'easy-notification-bar:close', { bubbles: true } ) );
		}
	} );

} )();