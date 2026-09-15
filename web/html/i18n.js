// ─── ctrlTAB i18n ─────────────────────────────────────────────────────────────
// Lightweight translation system. No external dependencies.
// Usage: t('key')  or  t('key', { name: 'Work' })  for interpolation.
// Language is auto-detected from browser; user can override in Settings.
// ──────────────────────────────────────────────────────────────────────────────

const TRANSLATIONS = {

  en: {
    // ── Navigation ──────────────────────────────────────────────
    'nav.subtitle':                      'Link Manager',
    'nav.collections_label':             'Collections',
    'nav.search_placeholder':            'Search links...',
    'nav.search_clear':                  'Clear search',
    'nav.settings':                      'Settings',
    'nav.home_tooltip':                  'Go to last collection',

    // ── Collections ─────────────────────────────────────────────
    'btn.add_collection':                'Add Collection',
    'collection.edit':                   'Edit collection',
    'collection.empty':                  'Create your first collection',
    'collection.empty_btn':              'New Collection',
    'modal.add_collection':              'Add Collection',
    'modal.edit_collection':             'Edit Collection',
    'modal.delete_collection':           'Delete Collection',
    'confirm.delete_collection':         'Are you sure you want to delete "{name}"?',
    'confirm.delete_collection_warning': 'This will permanently delete all sections and links in this collection.',
    'error.create_collection':           'Failed to create collection',
    'error.update_collection':           'Failed to update collection',
    'error.delete_collection':           'Failed to delete collection',
    'error.load_collection':             'Failed to load collection',
    'form.collection_name_placeholder':  'e.g., Work Projects',

    // ── Sections ────────────────────────────────────────────────
    'btn.add_section':                   'Add Section',
    'section.empty':                     'No sections yet. Click "Add Section" to get started.',
    'section.edit':                      'Edit section',
    'modal.add_section':                 'Add Section',
    'modal.edit_section':                'Edit Section',
    'modal.delete_section':              'Delete Section',
    'confirm.delete_section':            'Are you sure you want to delete this section?',
    'confirm.delete_section_warning':    'This will permanently delete all links in this section.',
    'error.create_section':              'Failed to create section',
    'error.update_section':              'Failed to update section',
    'error.delete_section':              'Failed to delete section',
    'form.section_name_placeholder':     'e.g., Documentation',

    // ── Links ───────────────────────────────────────────────────
    'btn.add_link':                      'Add link',
    'btn.sort_alpha':                    'Sort A-Z',
    'btn.edit_link':                     'Edit link',
    'btn.copy_url':                      'Copy URL',
    'link.empty':                        'No links yet',
    'modal.add_link':                    'Add Link',
    'modal.edit_link':                   'Edit Link',
    'modal.delete_link':                 'Delete Link',
    'confirm.delete_link':               'Are you sure you want to delete this link?',
    'error.create_link':                 'Failed to create link',
    'error.update_link':                 'Failed to update link',
    'error.delete_link':                 'Failed to delete link',
    'form.link_title_placeholder':       'e.g., GitHub',
    'form.link_url_placeholder':         'https://github.com',
    'form.icon_label':                   'Icon (optional)',
    'form.icon_hint':                    'PNG, SVG or ICO \u00b7 max 2 MB',
    'btn.upload_icon':                   'Upload icon',

    // ── Shared form ─────────────────────────────────────────────
    'form.name_label':                   'Name',
    'form.title_label':                  'Title',
    'form.url_label':                    'URL',
    'btn.cancel':                        'Cancel',
    'btn.create':                        'Create',
    'btn.save':                          'Save',
    'btn.delete':                        'Delete',
    'btn.remove':                        'Remove',
    'btn.back':                          'Back',

    // ── Settings — general ──────────────────────────────────────
    'settings.title':                    'Settings',
    'settings.theme':                    'Theme',
    'settings.preferences':              'Preferences',
    'settings.account':                  'Account',
    'settings.data':                     'Data',
    'settings.language':                 'Language',

    // ── Settings — themes ───────────────────────────────────────
    'theme.light':                       'Light',
    'theme.dark':                        'Dark',
    'theme.oled':                        'OLED',
    'theme.cyberpunk':                   'Cyberpunk',
    'theme.batman':                      'Batman',

    // ── Settings — background ───────────────────────────────────
    'settings.background_image':         'Background image',
    'settings.no_background':            'No background set',
    'settings.dim_background':           'Dim background',
    'btn.upload_bg':                     'Upload',
    'btn.change_bg':                     'Change',
    'settings.video_background':         'YouTube video background',
    'settings.no_video':                 'No video set',
    'settings.youtube_placeholder':      'YouTube URL or video ID',
    'btn.set_video':                     'Set',
    'error.invalid_youtube_url':         'Invalid YouTube URL',

    // ── Settings — accent color ─────────────────────────────────
    'settings.accent_color':             'Accent color',
    'settings.custom_color':             'Custom color',

    // ── Settings — preferences ──────────────────────────────────
    'pref.open_new_tab':                 'Open links in new tab',
    'pref.show_url':                     'Show URL in link cards',
    'pref.two_col':                      'Two-column section layout',

    // ── Settings — user management ──────────────────────────────
    'admin.user_management':             'User Management',
    'admin.loading_users':               'Loading users...',
    'admin.col_username':                'Username',
    'admin.col_role':                    'Role',
    'admin.col_created':                 'Created',
    'admin.col_actions':                 'Actions',
    'btn.add_user':                      'Add User',
    'btn.edit_user':                     'Edit',
    'btn.delete_user':                   'Delete',
    'modal.add_user':                    'Add User',
    'modal.edit_user':                   'Edit User',
    'modal.delete_user':                 'Delete User',
    'confirm.delete_user':               'Are you sure you want to delete "{name}"?',
    'confirm.delete_user_warning':       'This will permanently delete all their collections, sections, and links.',
    'form.password_label':               'Password',
    'form.new_password_optional':        'New Password (leave empty to keep current)',
    'form.password_hint':                'Minimum 6 characters',
    'form.admin_privileges':             'Admin privileges',
    'btn.create_user':                   'Create User',
    'error.load_users':                  'Failed to load users',
    'error.create_user':                 'Failed to create user',
    'error.load_user':                   'Failed to load user',
    'error.update_user':                 'Failed to update user',
    'error.delete_user':                 'Failed to delete user',

    // ── Settings — account ──────────────────────────────────────
    'account.username':                  'Username',
    'account.role':                      'Role',
    'account.role_admin':                'Admin',
    'account.role_user':                 'User',
    'btn.change_password':               'Change Password',
    'btn.logout':                        'Logout',

    // ── Settings — data / export ─────────────────────────────────
    'export.title':                      'Export data',
    'export.hint':                       'Download all your collections, sections and links as a JSON backup file.',
    'btn.export_json':                   'Export JSON',
    'export.exporting':                  'Exporting\u2026',
    'export.failed':                     'Export failed.',

    // ── Settings — data / import ────────────────────────────────
    'import.section_title':              'Import data',
    'import.section_hint':               'Import collections from a backup or another service.',
    'btn.import_data':                   'Import data\u2026',
    'modal.import_data':                 'Import data',
    'btn.import':                        'Import',
    'import.ctrltab_title':              'Import ctrlTAB backup',
    'import.ctrltab_hint':               'Restore collections from a previously exported ctrlTAB JSON backup.',
    'import.linkwarden_title':           'Import from Linkwarden',
    'import.linkwarden_hint':            'Upload a Linkwarden JSON export file. Each collection will be imported with one section (\u201cLinks\u201d).',
    'import.bookmarks_title':            'Import browser bookmarks',
    'import.bookmarks_hint':             'Import bookmarks from Chrome, Firefox, or any browser that exports the Netscape HTML format.',
    'btn.choose_file':                   'Choose file',
    'import.importing':                  'Importing\u2026',
    'import.success':                    '\u2713 Imported {collections} collection{c_plural}, {links} link{l_plural}.',
    'import.failed':                     'Import failed.',

    // ── Settings — footer ───────────────────────────────────────
    'footer.credits':                    'Built by Michael Smith, with Claude Code',

    // ── Change password modal ───────────────────────────────────
    'modal.change_password':             'Change Password',
    'form.current_password':             'Current Password',
    'form.new_password':                 'New Password',
    'form.confirm_password':             'Confirm New Password',
    'error.password_mismatch':           'New passwords do not match',
    'success.password_changed':          'Password changed successfully',
    'error.change_password':             'Failed to change password',

    // ── Search ──────────────────────────────────────────────────
    'search.title':                      'Search: \u201c{query}\u201d',
    'search.no_results':                 'No results for \u201c{query}\u201d',
    'search.result_count':               '{n} result{plural}',

    // ── Login ───────────────────────────────────────────────────
    'login.subtitle':                    'Link Manager',
    'login.username':                    'Username',
    'login.password':                    'Password',
    'login.or':                          'or',
    'btn.login':                         'Login',
    'error.login_failed':                'Login failed',
  },

  // ─────────────────────────────────────────────────────────────
  nl: {
    // ── Navigatie ────────────────────────────────────────────────
    'nav.subtitle':                      'Link Manager',
    'nav.collections_label':             'Collecties',
    'nav.search_placeholder':            'Links zoeken\u2026',
    'nav.search_clear':                  'Zoekopdracht wissen',
    'nav.settings':                      'Instellingen',
    'nav.home_tooltip':                  'Ga naar laatste collectie',

    // ── Collecties ───────────────────────────────────────────────
    'btn.add_collection':                'Collectie toevoegen',
    'collection.edit':                   'Collectie bewerken',
    'collection.empty':                  'Maak je eerste collectie aan',
    'collection.empty_btn':              'Nieuwe collectie',
    'modal.add_collection':              'Collectie toevoegen',
    'modal.edit_collection':             'Collectie bewerken',
    'modal.delete_collection':           'Collectie verwijderen',
    'confirm.delete_collection':         'Weet je zeker dat je \u201c{name}\u201d wilt verwijderen?',
    'confirm.delete_collection_warning': 'Dit verwijdert permanent alle secties en links in deze collectie.',
    'error.create_collection':           'Kan collectie niet aanmaken',
    'error.update_collection':           'Kan collectie niet bijwerken',
    'error.delete_collection':           'Kan collectie niet verwijderen',
    'error.load_collection':             'Kan collectie niet laden',
    'form.collection_name_placeholder':  'bijv. Werkprojecten',

    // ── Secties ──────────────────────────────────────────────────
    'btn.add_section':                   'Sectie toevoegen',
    'section.empty':                     'Nog geen secties. Klik op \u201cSectie toevoegen\u201d om te beginnen.',
    'section.edit':                      'Sectie bewerken',
    'modal.add_section':                 'Sectie toevoegen',
    'modal.edit_section':                'Sectie bewerken',
    'modal.delete_section':              'Sectie verwijderen',
    'confirm.delete_section':            'Weet je zeker dat je deze sectie wilt verwijderen?',
    'confirm.delete_section_warning':    'Dit verwijdert permanent alle links in deze sectie.',
    'error.create_section':              'Kan sectie niet aanmaken',
    'error.update_section':              'Kan sectie niet bijwerken',
    'error.delete_section':              'Kan sectie niet verwijderen',
    'form.section_name_placeholder':     'bijv. Documentatie',

    // ── Links ────────────────────────────────────────────────────
    'btn.add_link':                      'Link toevoegen',
    'btn.sort_alpha':                    'Sorteren A-Z',
    'btn.edit_link':                     'Link bewerken',
    'btn.copy_url':                      'URL kopi\u00ebren',
    'link.empty':                        'Nog geen links',
    'modal.add_link':                    'Link toevoegen',
    'modal.edit_link':                   'Link bewerken',
    'modal.delete_link':                 'Link verwijderen',
    'confirm.delete_link':               'Weet je zeker dat je deze link wilt verwijderen?',
    'error.create_link':                 'Kan link niet aanmaken',
    'error.update_link':                 'Kan link niet bijwerken',
    'error.delete_link':                 'Kan link niet verwijderen',
    'form.link_title_placeholder':       'bijv. GitHub',
    'form.link_url_placeholder':         'https://github.com',
    'form.icon_label':                   'Pictogram (optioneel)',
    'form.icon_hint':                    'PNG, SVG of ICO \u00b7 max 2 MB',
    'btn.upload_icon':                   'Pictogram uploaden',

    // ── Gedeeld formulier ────────────────────────────────────────
    'form.name_label':                   'Naam',
    'form.title_label':                  'Titel',
    'form.url_label':                    'URL',
    'btn.cancel':                        'Annuleren',
    'btn.create':                        'Aanmaken',
    'btn.save':                          'Opslaan',
    'btn.delete':                        'Verwijderen',
    'btn.remove':                        'Verwijderen',
    'btn.back':                          'Terug',

    // ── Instellingen — algemeen ──────────────────────────────────
    'settings.title':                    'Instellingen',
    'settings.theme':                    'Thema',
    'settings.preferences':              'Voorkeuren',
    'settings.account':                  'Account',
    'settings.data':                     'Gegevens',
    'settings.language':                 'Taal',

    // ── Instellingen — thema's ───────────────────────────────────
    'theme.light':                       'Licht',
    'theme.dark':                        'Donker',
    'theme.oled':                        'OLED',
    'theme.cyberpunk':                   'Cyberpunk',
    'theme.batman':                      'Batman',

    // ── Instellingen — achtergrond ───────────────────────────────
    'settings.background_image':         'Achtergrondafbeelding',
    'settings.no_background':            'Geen achtergrond ingesteld',
    'settings.dim_background':           'Achtergrond dimmen',
    'btn.upload_bg':                     'Uploaden',
    'btn.change_bg':                     'Wijzigen',
    'settings.video_background':         'YouTube-videoachtergrond',
    'settings.no_video':                 'Geen video ingesteld',
    'settings.youtube_placeholder':      'YouTube-URL of video-ID',
    'btn.set_video':                     'Instellen',
    'error.invalid_youtube_url':         'Ongeldige YouTube-URL',

    // ── Instellingen — accentkleur ───────────────────────────────
    'settings.accent_color':             'Accentkleur',
    'settings.custom_color':             'Aangepaste kleur',

    // ── Instellingen — voorkeuren ────────────────────────────────
    'pref.open_new_tab':                 'Links openen in nieuw tabblad',
    'pref.show_url':                     'URL tonen in linkaarten',
    'pref.two_col':                      'Indeling met twee kolommen',

    // ── Instellingen — gebruikersbeheer ──────────────────────────
    'admin.user_management':             'Gebruikersbeheer',
    'admin.loading_users':               'Gebruikers laden\u2026',
    'admin.col_username':                'Gebruikersnaam',
    'admin.col_role':                    'Rol',
    'admin.col_created':                 'Aangemaakt',
    'admin.col_actions':                 'Acties',
    'btn.add_user':                      'Gebruiker toevoegen',
    'btn.edit_user':                     'Bewerken',
    'btn.delete_user':                   'Verwijderen',
    'modal.add_user':                    'Gebruiker toevoegen',
    'modal.edit_user':                   'Gebruiker bewerken',
    'modal.delete_user':                 'Gebruiker verwijderen',
    'confirm.delete_user':               'Weet je zeker dat je \u201c{name}\u201d wilt verwijderen?',
    'confirm.delete_user_warning':       'Dit verwijdert permanent al hun collecties, secties en links.',
    'form.password_label':               'Wachtwoord',
    'form.new_password_optional':        'Nieuw wachtwoord (leeg laten om huidig te behouden)',
    'form.password_hint':                'Minimaal 6 tekens',
    'form.admin_privileges':             'Beheerdersrechten',
    'btn.create_user':                   'Gebruiker aanmaken',
    'error.load_users':                  'Kan gebruikers niet laden',
    'error.create_user':                 'Kan gebruiker niet aanmaken',
    'error.load_user':                   'Kan gebruiker niet laden',
    'error.update_user':                 'Kan gebruiker niet bijwerken',
    'error.delete_user':                 'Kan gebruiker niet verwijderen',

    // ── Instellingen — account ───────────────────────────────────
    'account.username':                  'Gebruikersnaam',
    'account.role':                      'Rol',
    'account.role_admin':                'Beheerder',
    'account.role_user':                 'Gebruiker',
    'btn.change_password':               'Wachtwoord wijzigen',
    'btn.logout':                        'Afmelden',

    // ── Instellingen — gegevens / exporteren ─────────────────────
    'export.title':                      'Gegevens exporteren',
    'export.hint':                       'Download al je collecties, secties en links als JSON-back-upbestand.',
    'btn.export_json':                   'JSON exporteren',
    'export.exporting':                  'Exporteren\u2026',
    'export.failed':                     'Exporteren mislukt.',

    // ── Instellingen — gegevens / import ─────────────────────────
    'import.section_title':              'Gegevens importeren',
    'import.section_hint':               'Importeer collecties vanuit een back-up of een andere dienst.',
    'btn.import_data':                   'Gegevens importeren\u2026',
    'modal.import_data':                 'Gegevens importeren',
    'btn.import':                        'Importeren',
    'import.ctrltab_title':              'ctrlTAB back-up importeren',
    'import.ctrltab_hint':               'Herstel collecties vanuit een eerder ge\u00ebxporteerde ctrlTAB JSON-back-up.',
    'import.linkwarden_title':           'Importeren uit Linkwarden',
    'import.linkwarden_hint':            'Upload een Linkwarden JSON-exportbestand. Elke collectie wordt ge\u00efmporteerd met \u00e9\u00e9n sectie (\u201cLinks\u201d).',
    'import.bookmarks_title':            'Browserbladwijzers importeren',
    'import.bookmarks_hint':             'Importeer bladwijzers uit Chrome, Firefox of een andere browser die Netscape HTML-formaat exporteert.',
    'btn.choose_file':                   'Bestand kiezen',
    'import.importing':                  'Importeren\u2026',
    'import.success':                    '\u2713 {collections} collectie{c_plural} en {links} link{l_plural} ge\u00efmporteerd.',
    'import.failed':                     'Importeren mislukt.',

    // ── Instellingen — footer ────────────────────────────────────
    'footer.credits':                    'Built by Michael Smith, with Claude Code',

    // ── Wachtwoord wijzigen ──────────────────────────────────────
    'modal.change_password':             'Wachtwoord wijzigen',
    'form.current_password':             'Huidig wachtwoord',
    'form.new_password':                 'Nieuw wachtwoord',
    'form.confirm_password':             'Nieuw wachtwoord bevestigen',
    'error.password_mismatch':           'Nieuwe wachtwoorden komen niet overeen',
    'success.password_changed':          'Wachtwoord succesvol gewijzigd',
    'error.change_password':             'Kan wachtwoord niet wijzigen',

    // ── Zoeken ───────────────────────────────────────────────────
    'search.title':                      'Zoeken: \u201c{query}\u201d',
    'search.no_results':                 'Geen resultaten voor \u201c{query}\u201d',
    'search.result_count':               '{n} resultaat{plural}',

    // ── Inloggen ─────────────────────────────────────────────────
    'login.subtitle':                    'Link Manager',
    'login.username':                    'Gebruikersnaam',
    'login.password':                    'Wachtwoord',
    'login.or':                          'of',
    'btn.login':                         'Inloggen',
    'error.login_failed':                'Inloggen mislukt',
  },

  // ─────────────────────────────────────────────────────────────
  es: {
    // ── Navegaci\u00f3n ───────────────────────────────────────────────
    'nav.subtitle':                      'Gestor de enlaces',
    'nav.collections_label':             'Colecciones',
    'nav.search_placeholder':            'Buscar enlaces\u2026',
    'nav.search_clear':                  'Borrar b\u00fasqueda',
    'nav.settings':                      'Configuraci\u00f3n',
    'nav.home_tooltip':                  'Ir a la \u00faltima colecci\u00f3n',

    // ── Colecciones ──────────────────────────────────────────────
    'btn.add_collection':                'Agregar colecci\u00f3n',
    'collection.edit':                   'Editar colecci\u00f3n',
    'collection.empty':                  'Crea tu primera colecci\u00f3n',
    'collection.empty_btn':              'Nueva colecci\u00f3n',
    'modal.add_collection':              'Agregar colecci\u00f3n',
    'modal.edit_collection':             'Editar colecci\u00f3n',
    'modal.delete_collection':           'Eliminar colecci\u00f3n',
    'confirm.delete_collection':         '\u00bfEst\u00e1s seguro de que quieres eliminar \u201c{name}\u201d?',
    'confirm.delete_collection_warning': 'Esto eliminar\u00e1 permanentemente todas las secciones y enlaces de esta colecci\u00f3n.',
    'error.create_collection':           'Error al crear la colecci\u00f3n',
    'error.update_collection':           'Error al actualizar la colecci\u00f3n',
    'error.delete_collection':           'Error al eliminar la colecci\u00f3n',
    'error.load_collection':             'Error al cargar la colecci\u00f3n',
    'form.collection_name_placeholder':  'ej. Proyectos de trabajo',

    // ── Secciones ────────────────────────────────────────────────
    'btn.add_section':                   'Agregar secci\u00f3n',
    'section.empty':                     'Sin secciones a\u00fan. Haz clic en \u201cAgregar secci\u00f3n\u201d para empezar.',
    'section.edit':                      'Editar secci\u00f3n',
    'modal.add_section':                 'Agregar secci\u00f3n',
    'modal.edit_section':                'Editar secci\u00f3n',
    'modal.delete_section':              'Eliminar secci\u00f3n',
    'confirm.delete_section':            '\u00bfEst\u00e1s seguro de que quieres eliminar esta secci\u00f3n?',
    'confirm.delete_section_warning':    'Esto eliminar\u00e1 permanentemente todos los enlaces de esta secci\u00f3n.',
    'error.create_section':              'Error al crear la secci\u00f3n',
    'error.update_section':              'Error al actualizar la secci\u00f3n',
    'error.delete_section':              'Error al eliminar la secci\u00f3n',
    'form.section_name_placeholder':     'ej. Documentaci\u00f3n',

    // ── Enlaces ──────────────────────────────────────────────────
    'btn.add_link':                      'Agregar enlace',
    'btn.sort_alpha':                    'Ordenar A-Z',
    'btn.edit_link':                     'Editar enlace',
    'btn.copy_url':                      'Copiar URL',
    'link.empty':                        'Sin enlaces a\u00fan',
    'modal.add_link':                    'Agregar enlace',
    'modal.edit_link':                   'Editar enlace',
    'modal.delete_link':                 'Eliminar enlace',
    'confirm.delete_link':               '\u00bfEst\u00e1s seguro de que quieres eliminar este enlace?',
    'error.create_link':                 'Error al crear el enlace',
    'error.update_link':                 'Error al actualizar el enlace',
    'error.delete_link':                 'Error al eliminar el enlace',
    'form.link_title_placeholder':       'ej. GitHub',
    'form.link_url_placeholder':         'https://github.com',
    'form.icon_label':                   'Icono (opcional)',
    'form.icon_hint':                    'PNG, SVG o ICO \u00b7 m\u00e1x. 2 MB',
    'btn.upload_icon':                   'Subir icono',

    // ── Formulario compartido ────────────────────────────────────
    'form.name_label':                   'Nombre',
    'form.title_label':                  'T\u00edtulo',
    'form.url_label':                    'URL',
    'btn.cancel':                        'Cancelar',
    'btn.create':                        'Crear',
    'btn.save':                          'Guardar',
    'btn.delete':                        'Eliminar',
    'btn.remove':                        'Quitar',
    'btn.back':                          'Volver',

    // ── Configuraci\u00f3n — general ────────────────────────────────────
    'settings.title':                    'Configuraci\u00f3n',
    'settings.theme':                    'Tema',
    'settings.preferences':              'Preferencias',
    'settings.account':                  'Cuenta',
    'settings.data':                     'Datos',
    'settings.language':                 'Idioma',

    // ── Configuraci\u00f3n — temas ──────────────────────────────────────
    'theme.light':                       'Claro',
    'theme.dark':                        'Oscuro',
    'theme.oled':                        'OLED',
    'theme.cyberpunk':                   'Cyberpunk',
    'theme.batman':                      'Batman',

    // ── Configuraci\u00f3n — fondo ───────────────────────────────────────
    'settings.background_image':         'Imagen de fondo',
    'settings.no_background':            'Sin fondo configurado',
    'settings.dim_background':           'Atenuar fondo',
    'btn.upload_bg':                     'Subir',
    'btn.change_bg':                     'Cambiar',
    'settings.video_background':         'Fondo de video de YouTube',
    'settings.no_video':                 'Sin video configurado',
    'settings.youtube_placeholder':      'URL de YouTube o ID de video',
    'btn.set_video':                     'Establecer',
    'error.invalid_youtube_url':         'URL de YouTube no v\u00e1lida',

    // ── Configuraci\u00f3n — color de acento ────────────────────────────
    'settings.accent_color':             'Color de acento',
    'settings.custom_color':             'Color personalizado',

    // ── Configuraci\u00f3n — preferencias ──────────────────────────────
    'pref.open_new_tab':                 'Abrir enlaces en nueva pesta\u00f1a',
    'pref.show_url':                     'Mostrar URL en las tarjetas',
    'pref.two_col':                      'Dise\u00f1o de dos columnas',

    // ── Configuraci\u00f3n — gesti\u00f3n de usuarios ───────────────────────
    'admin.user_management':             'Gesti\u00f3n de usuarios',
    'admin.loading_users':               'Cargando usuarios\u2026',
    'admin.col_username':                'Usuario',
    'admin.col_role':                    'Rol',
    'admin.col_created':                 'Creado',
    'admin.col_actions':                 'Acciones',
    'btn.add_user':                      'Agregar usuario',
    'btn.edit_user':                     'Editar',
    'btn.delete_user':                   'Eliminar',
    'modal.add_user':                    'Agregar usuario',
    'modal.edit_user':                   'Editar usuario',
    'modal.delete_user':                 'Eliminar usuario',
    'confirm.delete_user':               '\u00bfEst\u00e1s seguro de que quieres eliminar \u201c{name}\u201d?',
    'confirm.delete_user_warning':       'Esto eliminar\u00e1 permanentemente todas sus colecciones, secciones y enlaces.',
    'form.password_label':               'Contrase\u00f1a',
    'form.new_password_optional':        'Nueva contrase\u00f1a (dejar vac\u00edo para mantener la actual)',
    'form.password_hint':                'M\u00ednimo 6 caracteres',
    'form.admin_privileges':             'Privilegios de administrador',
    'btn.create_user':                   'Crear usuario',
    'error.load_users':                  'Error al cargar usuarios',
    'error.create_user':                 'Error al crear usuario',
    'error.load_user':                   'Error al cargar usuario',
    'error.update_user':                 'Error al actualizar usuario',
    'error.delete_user':                 'Error al eliminar usuario',

    // ── Configuraci\u00f3n — cuenta ─────────────────────────────────────
    'account.username':                  'Usuario',
    'account.role':                      'Rol',
    'account.role_admin':                'Administrador',
    'account.role_user':                 'Usuario',
    'btn.change_password':               'Cambiar contrase\u00f1a',
    'btn.logout':                        'Cerrar sesi\u00f3n',

    // ── Configuraci\u00f3n — datos / exportar ───────────────────────────
    'export.title':                      'Exportar datos',
    'export.hint':                       'Descarga todas tus colecciones, secciones y enlaces como archivo JSON de respaldo.',
    'btn.export_json':                   'Exportar JSON',
    'export.exporting':                  'Exportando\u2026',
    'export.failed':                     'Error al exportar.',

    // ── Configuraci\u00f3n — datos / importar ──────────────────────────
    'import.section_title':              'Importar datos',
    'import.section_hint':               'Importa colecciones desde un respaldo u otro servicio.',
    'btn.import_data':                   'Importar datos\u2026',
    'modal.import_data':                 'Importar datos',
    'btn.import':                        'Importar',
    'import.ctrltab_title':              'Importar respaldo ctrlTAB',
    'import.ctrltab_hint':               'Restaura colecciones desde un respaldo JSON de ctrlTAB exportado previamente.',
    'import.linkwarden_title':           'Importar desde Linkwarden',
    'import.linkwarden_hint':            'Sube un archivo de exportaci\u00f3n JSON de Linkwarden. Cada colecci\u00f3n se importar\u00e1 con una secci\u00f3n (\u201cEnlaces\u201d).',
    'import.bookmarks_title':            'Importar marcadores del navegador',
    'import.bookmarks_hint':             'Importa marcadores desde Chrome, Firefox o cualquier navegador que exporte en formato HTML de Netscape.',
    'btn.choose_file':                   'Elegir archivo',
    'import.importing':                  'Importando\u2026',
    'import.success':                    '\u2713 {collections} colecci\u00f3n{c_plural} y {links} enlace{l_plural} importado{l_plural}.',
    'import.failed':                     'Error al importar.',

    // ── Configuraci\u00f3n — pie de p\u00e1gina ──────────────────────────────
    'footer.credits':                    'Built by Michael Smith, with Claude Code',

    // ── Cambiar contrase\u00f1a ─────────────────────────────────────────
    'modal.change_password':             'Cambiar contrase\u00f1a',
    'form.current_password':             'Contrase\u00f1a actual',
    'form.new_password':                 'Nueva contrase\u00f1a',
    'form.confirm_password':             'Confirmar nueva contrase\u00f1a',
    'error.password_mismatch':           'Las nuevas contrase\u00f1as no coinciden',
    'success.password_changed':          'Contrase\u00f1a cambiada exitosamente',
    'error.change_password':             'Error al cambiar la contrase\u00f1a',

    // ── B\u00fasqueda ────────────────────────────────────────────────────
    'search.title':                      'B\u00fasqueda: \u201c{query}\u201d',
    'search.no_results':                 'Sin resultados para \u201c{query}\u201d',
    'search.result_count':               '{n} resultado{plural}',

    // ── Inicio de sesi\u00f3n ───────────────────────────────────────────
    'login.subtitle':                    'Gestor de enlaces',
    'login.username':                    'Usuario',
    'login.password':                    'Contrase\u00f1a',
    'login.or':                          'o',
    'btn.login':                         'Iniciar sesi\u00f3n',
    'error.login_failed':                'Error al iniciar sesi\u00f3n',
  },
};

// ── Core ──────────────────────────────────────────────────────────────────────

let _lang = 'en';

function detectLang() {
  const saved = localStorage.getItem('ctrltab-lang');
  if (saved === 'nl' || saved === 'en' || saved === 'es') return saved;
  const lang = navigator.language?.toLowerCase() ?? '';
  if (lang.startsWith('nl')) return 'nl';
  if (lang.startsWith('es')) return 'es';
  return 'en';
}

/**
 * Translate a key, with optional variable interpolation.
 * t('confirm.delete_collection', { name: 'Work' })
 * Falls back to English, then to the key itself.
 */
function t(key, vars) {
  let str = TRANSLATIONS[_lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{${k}}`, v);
    }
  }
  return str;
}
