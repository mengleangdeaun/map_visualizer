import { createRootRoute, createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { systemRoutes } from '../domains/system/routes';


// Root Route will be defined in index.tsx
// Child Routes

const ComingSoon = () => (
    <div className="p-10 text-center">
        <h2 className="text-2xl font-bold text-primary">Coming Soon</h2>
        <p className="text-muted-foreground">This domain is currently being migrated to the TanStack ecosystem.</p>
    </div>
);

const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: lazyRouteComponent(() => import('../domains/admin/pages/Index')),
});


// Template Placeholder Routes (To be migrated to Domains)
const analyticsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/analytics', component: ComingSoon });
const financeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/finance', component: ComingSoon });
const cryptoRoute = createRoute({ getParentRoute: () => rootRoute, path: '/crypto', component: ComingSoon });

// Apps
const chatRoute = createRoute({ getParentRoute: () => rootRoute, path: '/apps/chat', component: ComingSoon });
const mailboxRoute = createRoute({ getParentRoute: () => rootRoute, path: '/apps/mailbox', component: ComingSoon });
const todoListRoute = createRoute({ getParentRoute: () => rootRoute, path: '/apps/todolist', component: ComingSoon });
const notesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/apps/notes', component: ComingSoon });
const scrumboardRoute = createRoute({ getParentRoute: () => rootRoute, path: '/apps/scrumboard', component: ComingSoon });
const contactsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/apps/contacts', component: ComingSoon });
const calendarRoute = createRoute({ getParentRoute: () => rootRoute, path: '/apps/calendar', component: ComingSoon });

// Invoices
const invoiceListRoute = createRoute({ getParentRoute: () => rootRoute, path: '/apps/invoice/list', component: ComingSoon });
const invoicePreviewRoute = createRoute({ getParentRoute: () => rootRoute, path: '/apps/invoice/preview', component: ComingSoon });
const invoiceAddRoute = createRoute({ getParentRoute: () => rootRoute, path: '/apps/invoice/add', component: ComingSoon });
const invoiceEditRoute = createRoute({ getParentRoute: () => rootRoute, path: '/apps/invoice/edit', component: ComingSoon });

// Components & Elements (Legacy)
const tabsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/components/tabs', component: ComingSoon });
const accordionsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/components/accordions', component: ComingSoon });
const modalsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/components/modals', component: ComingSoon });
const cardsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/components/cards', component: ComingSoon });
const carouselRoute = createRoute({ getParentRoute: () => rootRoute, path: '/components/carousel', component: ComingSoon });
const countdownRoute = createRoute({ getParentRoute: () => rootRoute, path: '/components/countdown', component: ComingSoon });
const counterRoute = createRoute({ getParentRoute: () => rootRoute, path: '/components/counter', component: ComingSoon });
const sweetalertRoute = createRoute({ getParentRoute: () => rootRoute, path: '/components/sweetalert', component: ComingSoon });
const timelineRoute = createRoute({ getParentRoute: () => rootRoute, path: '/components/timeline', component: ComingSoon });
const notificationsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/components/notifications', component: ComingSoon });
const mediaObjectRoute = createRoute({ getParentRoute: () => rootRoute, path: '/components/media-object', component: ComingSoon });
const listGroupRoute = createRoute({ getParentRoute: () => rootRoute, path: '/components/list-group', component: ComingSoon });
const pricingTableRoute = createRoute({ getParentRoute: () => rootRoute, path: '/components/pricing-table', component: ComingSoon });
const lightboxRoute = createRoute({ getParentRoute: () => rootRoute, path: '/components/lightbox', component: ComingSoon });

// Elements
const alertsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/elements/alerts', component: ComingSoon });
const avatarRoute = createRoute({ getParentRoute: () => rootRoute, path: '/elements/avatar', component: ComingSoon });
const badgesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/elements/badges', component: ComingSoon });
const breadcrumbsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/elements/breadcrumbs', component: ComingSoon });
const buttonsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/elements/buttons', component: ComingSoon });
const buttonsGroupRoute = createRoute({ getParentRoute: () => rootRoute, path: '/elements/buttons-group', component: ComingSoon });
const colorLibraryRoute = createRoute({ getParentRoute: () => rootRoute, path: '/elements/color-library', component: ComingSoon });
const dropdownRoute = createRoute({ getParentRoute: () => rootRoute, path: '/elements/dropdown', component: ComingSoon });
const infoboxRoute = createRoute({ getParentRoute: () => rootRoute, path: '/elements/infobox', component: ComingSoon });
const jumbotronRoute = createRoute({ getParentRoute: () => rootRoute, path: '/elements/jumbotron', component: ComingSoon });
const loaderRoute = createRoute({ getParentRoute: () => rootRoute, path: '/elements/loader', component: ComingSoon });
const paginationRoute = createRoute({ getParentRoute: () => rootRoute, path: '/elements/pagination', component: ComingSoon });
const popoversRoute = createRoute({ getParentRoute: () => rootRoute, path: '/elements/popovers', component: ComingSoon });
const progressBarRoute = createRoute({ getParentRoute: () => rootRoute, path: '/elements/progress-bar', component: ComingSoon });
const searchRoute = createRoute({ getParentRoute: () => rootRoute, path: '/elements/search', component: ComingSoon });
const tooltipsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/elements/tooltips', component: ComingSoon });
const treeviewRoute = createRoute({ getParentRoute: () => rootRoute, path: '/elements/treeview', component: ComingSoon });
const typographyRoute = createRoute({ getParentRoute: () => rootRoute, path: '/elements/typography', component: ComingSoon });

// Others
const chartsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/charts', component: ComingSoon });
const widgetsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/widgets', component: ComingSoon });
const fontIconsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/font-icons', component: ComingSoon });
const dragndropRoute = createRoute({ getParentRoute: () => rootRoute, path: '/dragndrop', component: ComingSoon });
const tablesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/tables', component: ComingSoon });
const usersProfileRoute = createRoute({ getParentRoute: () => rootRoute, path: '/users/profile', component: ComingSoon });
const userAccountSettingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/users/user-account-settings', component: ComingSoon });

// Auth & Pages
const boxedSigninRoute = createRoute({ getParentRoute: () => rootRoute, path: '/auth/boxed-signin', component: ComingSoon });
const boxedSignupRoute = createRoute({ getParentRoute: () => rootRoute, path: '/auth/boxed-signup', component: ComingSoon });
const boxedLockscreenRoute = createRoute({ getParentRoute: () => rootRoute, path: '/auth/boxed-lockscreen', component: ComingSoon });
const boxedPasswordResetRoute = createRoute({ getParentRoute: () => rootRoute, path: '/auth/boxed-password-reset', component: ComingSoon });
const coverLoginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/auth/cover-login', component: ComingSoon });
const coverRegisterRoute = createRoute({ getParentRoute: () => rootRoute, path: '/auth/cover-register', component: ComingSoon });
const coverLockscreenRoute = createRoute({ getParentRoute: () => rootRoute, path: '/auth/cover-lockscreen', component: ComingSoon });
const coverPasswordResetRoute = createRoute({ getParentRoute: () => rootRoute, path: '/auth/cover-password-reset', component: ComingSoon });

// Error & Static Pages
const error404Route = createRoute({ getParentRoute: () => rootRoute, path: '/pages/error404', component: ComingSoon });
const error500Route = createRoute({ getParentRoute: () => rootRoute, path: '/pages/error500', component: ComingSoon });
const error503Route = createRoute({ getParentRoute: () => rootRoute, path: '/pages/error503', component: ComingSoon });
const faqRoute = createRoute({ getParentRoute: () => rootRoute, path: '/pages/faq', component: ComingSoon });
const contactUsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/pages/contact-us', component: ComingSoon });
const comingSoonPageRoute = createRoute({ getParentRoute: () => rootRoute, path: '/pages/coming-soon', component: ComingSoon });
const maintenenceRoute = createRoute({ getParentRoute: () => rootRoute, path: '/pages/maintenence', component: ComingSoon });
const knowledgeBaseRoute = createRoute({ getParentRoute: () => rootRoute, path: '/pages/knowledge-base', component: ComingSoon });

// Forms
const formsBasicRoute = createRoute({ getParentRoute: () => rootRoute, path: '/forms/basic', component: ComingSoon });
const formsInputGroupRoute = createRoute({ getParentRoute: () => rootRoute, path: '/forms/input-group', component: ComingSoon });
const formsLayoutsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/forms/layouts', component: ComingSoon });
const formsValidationRoute = createRoute({ getParentRoute: () => rootRoute, path: '/forms/validation', component: ComingSoon });
const formsInputMaskRoute = createRoute({ getParentRoute: () => rootRoute, path: '/forms/input-mask', component: ComingSoon });
const formsSelect2Route = createRoute({ getParentRoute: () => rootRoute, path: '/forms/select2', component: ComingSoon });
const formsTouchspinRoute = createRoute({ getParentRoute: () => rootRoute, path: '/forms/touchspin', component: ComingSoon });
const formsCheckboxRadioRoute = createRoute({ getParentRoute: () => rootRoute, path: '/forms/checkbox-radio', component: ComingSoon });
const formsSwitchesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/forms/switches', component: ComingSoon });
const formsWizardsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/forms/wizards', component: ComingSoon });
const formsFileUploadRoute = createRoute({ getParentRoute: () => rootRoute, path: '/forms/file-upload', component: ComingSoon });
const formsQuillEditorRoute = createRoute({ getParentRoute: () => rootRoute, path: '/forms/quill-editor', component: ComingSoon });
const formsMarkdownEditorRoute = createRoute({ getParentRoute: () => rootRoute, path: '/forms/markdown-editor', component: ComingSoon });
const formsDatePickerRoute = createRoute({ getParentRoute: () => rootRoute, path: '/forms/date-picker', component: ComingSoon });
const formsClipboardRoute = createRoute({ getParentRoute: () => rootRoute, path: '/forms/clipboard', component: ComingSoon });




export const routeTree = [
    indexRoute,
    analyticsRoute,
    financeRoute,
    cryptoRoute,
    chatRoute,
    mailboxRoute,
    todoListRoute,
    notesRoute,
    scrumboardRoute,
    contactsRoute,
    calendarRoute,
    invoiceListRoute,
    invoicePreviewRoute,
    invoiceAddRoute,
    invoiceEditRoute,
    tabsRoute,
    accordionsRoute,
    modalsRoute,
    cardsRoute,
    carouselRoute,
    countdownRoute,
    counterRoute,
    sweetalertRoute,
    timelineRoute,
    notificationsRoute,
    mediaObjectRoute,
    listGroupRoute,
    pricingTableRoute,
    lightboxRoute,
    alertsRoute,
    avatarRoute,
    badgesRoute,
    breadcrumbsRoute,
    buttonsRoute,
    buttonsGroupRoute,
    colorLibraryRoute,
    dropdownRoute,
    infoboxRoute,
    jumbotronRoute,
    loaderRoute,
    paginationRoute,
    popoversRoute,
    progressBarRoute,
    searchRoute,
    tooltipsRoute,
    treeviewRoute,
    typographyRoute,
    chartsRoute,
    widgetsRoute,
    fontIconsRoute,
    dragndropRoute,
    tablesRoute,
    usersProfileRoute,
    userAccountSettingsRoute,
    boxedSigninRoute,
    boxedSignupRoute,
    boxedLockscreenRoute,
    boxedPasswordResetRoute,
    coverLoginRoute,
    coverRegisterRoute,
    coverLockscreenRoute,
    coverPasswordResetRoute,
    error404Route,
    error500Route,
    error503Route,
    faqRoute,
    contactUsRoute,
    comingSoonPageRoute,
    maintenenceRoute,
    knowledgeBaseRoute,
    formsBasicRoute,
    formsInputGroupRoute,
    formsLayoutsRoute,
    formsValidationRoute,
    formsInputMaskRoute,
    formsSelect2Route,
    formsTouchspinRoute,
    formsCheckboxRadioRoute,
    formsSwitchesRoute,
    formsWizardsRoute,
    formsFileUploadRoute,
    formsQuillEditorRoute,
    formsMarkdownEditorRoute,
    formsDatePickerRoute,
    formsClipboardRoute,
    ...systemRoutes,
];

// This file will be imported by index.tsx where rootRoute is defined
import { rootRoute } from './root';
