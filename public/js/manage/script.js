const contributorHMTL = user => {
    
}

const commentHTML = async comment => {
    const user = await $.ajax({
        url: `/api/user/${comment?.userID}`,
        type: "GET"
    });

    let html = $(`
    <div class="comment d-flex position-relative">
        <div class="position-absolute w-100 h-100 d-flex justify-content-center align-items-center delete-overlay">
            <div class="delete-comment">
                <div class="d-flex align-items-center delete-comment-content">
                    <i class="fa-solid fa-dumpster-fire me-2"></i>
                    <div>click to delete</div>
                </div>
            </div>
        </div>
        <a class="user-link">
            <div class="profile-picture" style="url(/img/user-unavailable.svg)"></div>
        </a>
        <div class="comment-text ms-2">
            <div class="handle clmp d-flex">
                <span class="user-select-none">@</span>
                <span>
                    <a class="user-link user-handle"></a>
                </span>
                <span>・</span>
                <span>${moment(comment.timestamp).fromNow()}</span>
            </div>
            <div class="comment-content"></div>
        </div>
    </div>`);

    $(html).attr("data-comment-id", comment.id);
    $(html).find("a.user-link").prop("href", `/user/${user.id}`);
    $(html).find(".user-handle").text(user.handle);
    $(html).find(".delete-comment").on("click", async () => {
        $(`.comment[data-comment-id=${CSS.escape(comment.id)}] .delete-comment-content`).html(`<i class="fa-solid fa-spinner fa-spin"></i>`);

        let res = await $.ajax({
            url: `/api/comment/${comment.id}`,
            method: "DELETE"
        });

        console.log(res);

        if (res.status == 200) {
            $(`.comment-delete-message`).css("color", "var(--bs-success)");
            $(`.comment-delete-message`).text("deleted comment successfully.");
            $(`.comment[data-comment-id=${CSS.escape(comment.id)}]`).remove();
        } else {
            $(`.comment-delete-message`).css("color", "var(--bs-danger)");
            $(`.comment-delete-message`).text("couldn't delete comment.");
        }
    });
    $(html).find(".profile-picture").css("background-image", `url(${CSS.escape(user.iconURL)}), url(/img/user-unavailable.svg)`);
    
    if (comment.content) $(html).find(".comment-content").text(comment.content);
    else {
        $(html).find(".comment-content").css("opacity", 0.6);
        $(html).find(".comment-content").text("- empty comment -");
    }

    return html;
}

$("document").ready(() => {
    const projectID = $(".project-id").text();
    $.ajax({
        url: `/api/project/${projectID}/contributors`,
        type: "GET",
        success: res => {
            console.log(res);
        }
    });

    $.ajax({
        url: `/api/project/${projectID}/comments`,
        type: "GET",
        success: async res => {
            if (!res || !res.length) {
                return $(".comments").html("no comments.")
            }

            let cleared = false;
            for (let i = 0; i < res.length; i++) {
                let commentThing = await commentHTML(res[i]);
                if (!cleared) {
                    cleared = true;
                    $(".comments").empty();
                }
                $(".comments").append(commentThing);
            }
        }
    });
});