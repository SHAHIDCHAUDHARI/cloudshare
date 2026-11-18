package com.fileshare.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

    /** Short link /f/abc123 shows the download page; the page then asks the API for the details. */
    @GetMapping("/f/{token}")
    public String downloadPage() {
        return "forward:/download.html";
    }
}
